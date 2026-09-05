import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import * as trackerApi from "@/lib/tracker";
import * as auth from "./useAuth";
import { useHistory, type HistoryFilters } from "./useHistory";

const filters: HistoryFilters = {
  period: "custom",
  startDate: "2026-09-01",
  endDate: "2026-09-05",
  onlyWeekdays: true,
  projectId: null,
};

const history = {
  rows: [],
  totals: {
    days: 0,
    workSeconds: 0,
    breakSeconds: 0,
    activeSeconds: 0,
    amountUsd: null,
  },
};

describe("useHistory", () => {
  afterEach(() => vi.restoreAllMocks());

  it("initializes the agreed history filters", async () => {
    vi.spyOn(auth, "useAuth").mockReturnValue({
      session: { accessToken: "token" } as never,
      isAuthenticated: true,
      status: "authenticated",
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
    const getHistory = vi.spyOn(trackerApi, "getHistory").mockResolvedValue(history);
    const { result } = renderHistory();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filters).toEqual({
      period: "month",
      onlyWeekdays: true,
      projectId: null,
    });
    expect(getHistory).toHaveBeenCalledWith("token", result.current.filters);
  });

  it("loads history with filters, exposes empty state, and preserves query errors", async () => {
    vi.spyOn(auth, "useAuth").mockReturnValue({
      session: { accessToken: "token" } as never,
      isAuthenticated: true,
      status: "authenticated",
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
    const getHistory = vi.spyOn(trackerApi, "getHistory").mockResolvedValue(history);
    const { result } = renderHistory(filters);

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getHistory).toHaveBeenCalledWith("token", filters);
    expect(result.current.data).toEqual(history);
    expect(result.current.isEmpty).toBe(true);
  });

  it("exposes query errors without replacing the selected filters", async () => {
    vi.spyOn(auth, "useAuth").mockReturnValue({
      session: { accessToken: "token" } as never,
      isAuthenticated: true,
      status: "authenticated",
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
    const error = new Error("No se pudo cargar el historial");
    vi.spyOn(trackerApi, "getHistory").mockRejectedValue(error);
    const { result } = renderHistory(filters);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.filters).toEqual(filters);
  });

  it("invalidates projects and all history queries only after a successful rate mutation", async () => {
    vi.spyOn(auth, "useAuth").mockReturnValue({
      session: { accessToken: "token" } as never,
      isAuthenticated: true,
      status: "authenticated",
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
    vi.spyOn(trackerApi, "getHistory").mockResolvedValue(history);
    const setRate = vi.spyOn(trackerApi, "setProjectRate").mockResolvedValue({
      projectId: "project-1",
      hourlyRate: 7,
      effectiveFrom: "2026-09-05",
    });
    const setOverride = vi.spyOn(trackerApi, "setDailyRateOverride").mockResolvedValue({
      projectId: "project-1",
      hourlyRate: 0,
      overrideDate: "2026-09-04",
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useHistory(filters), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.saveRate({ projectId: "project-1", hourlyRate: 7 });
      await result.current.saveDailyOverride({
        projectId: "project-1",
        date: "2026-09-04",
        hourlyRate: 0,
      });
    });

    expect(setRate).toHaveBeenCalledWith("token", "project-1", { hourlyRate: 7 });
    expect(setOverride).toHaveBeenCalledWith("token", "project-1", "2026-09-04", { hourlyRate: 0 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["projects", "token"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["history", "token"] });
  });

  it("keeps the cached history and skips invalidation when saving a rate fails", async () => {
    vi.spyOn(auth, "useAuth").mockReturnValue({
      session: { accessToken: "token" } as never,
      isAuthenticated: true,
      status: "authenticated",
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
    vi.spyOn(trackerApi, "getHistory").mockResolvedValue(history);
    const error = new Error("No se pudo guardar la tarifa");
    vi.spyOn(trackerApi, "setProjectRate").mockRejectedValue(error);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useHistory(filters), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await expect(result.current.saveRate({ projectId: "project-1", hourlyRate: 8 })).rejects.toBe(
        error,
      );
    });

    expect(result.current.data).toEqual(history);
    expect(invalidateQueries).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.rateError).toBe(error));
  });
});

function renderHistory(selectedFilters?: HistoryFilters) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useHistory(selectedFilters), { wrapper });
}
