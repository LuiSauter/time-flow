import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";
import * as trackerApi from "@/lib/tracker";
import { useTimeTracker } from "./useTimeTracker";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.useAuth }));

const accessToken = "token";
const session = {
  accessToken,
  user: { id: "user-1", fullName: "Diego", email: "diego@example.com" },
};

describe("useTimeTracker remote state", () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ session });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("hydrates from the remote snapshot and derives elapsed time from timestamps", async () => {
    const now = Date.now();
    vi.spyOn(trackerApi, "getTracker").mockResolvedValue(snapshot("project-1", now - 5_000));
    const { result } = renderTracker("project-1");

    await waitFor(() => expect(result.current.status).toBe("WORKING"));

    expect(result.current.segments[0]?.start).toBe(now - 5_000);
    expect(result.current.segments[0]?.end).toBeNull();
    expect(result.current.totals.currentSeconds).toBeGreaterThanOrEqual(5);
    expect(localStorage.getItem("TimeFlow.session.v1")).toBeNull();
  });

  it("ticks open segments and refetches when visibility returns", async () => {
    let clock = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => clock);
    const getTracker = vi
      .spyOn(trackerApi, "getTracker")
      .mockResolvedValue(snapshot("project-1", clock - 1_000));
    const { result } = renderTracker("project-1");

    await waitFor(() => expect(result.current.status).toBe("WORKING"));
    const initialNow = result.current.now;

    clock += 1_000;
    await new Promise((resolve) => setTimeout(resolve, 1_050));
    expect(result.current.now).toBe(initialNow + 1_000);

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(getTracker).toHaveBeenCalledTimes(2));
  });

  it("reloads exclusively for the selected project", async () => {
    const getTracker = vi
      .spyOn(trackerApi, "getTracker")
      .mockImplementation(async (_token, projectId) => snapshot(projectId, Date.now() - 2_000));
    const { result, rerender } = renderTracker("project-1");

    await waitFor(() => expect(result.current.projectId).toBe("project-1"));
    rerender({ projectId: "project-2" });

    await waitFor(() => expect(result.current.projectId).toBe("project-2"));
    expect(getTracker).toHaveBeenLastCalledWith(accessToken, "project-2", "all");
  });

  it("does not confirm a transition until the remote response succeeds", async () => {
    const deferred = deferredSnapshot();
    vi.spyOn(trackerApi, "getTracker").mockResolvedValue(snapshot("project-1", 0));
    const startTracker = vi.spyOn(trackerApi, "startTracker").mockReturnValue(deferred.promise);
    const { result } = renderTracker("project-1");

    await waitFor(() => expect(result.current.status).toBe("IDLE"));
    act(() => void result.current.startWork());
    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("IDLE");

    deferred.reject(new Error("No se pudo guardar la jornada"));
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(startTracker).toHaveBeenCalledWith(accessToken, "project-1");
    expect(result.current.status).toBe("IDLE");
    expect(result.current.error).toBe("No se pudo guardar la jornada");
  });
});

function renderTracker(projectId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(({ projectId: selectedProjectId }) => useTimeTracker(selectedProjectId), {
    initialProps: { projectId },
    wrapper,
  });
}

function snapshot(projectId: string, startedAt: number): trackerApi.TrackerSnapshot {
  const start = new Date(startedAt).toISOString();
  return {
    project: {
      id: projectId,
      name: projectId,
      timeZone: "America/La_Paz",
      dailyGoalMinutes: 480,
    },
    status: startedAt === 0 ? "IDLE" : "WORKING",
    openSessionId: startedAt === 0 ? null : "session-1",
    segments:
      startedAt === 0
        ? []
        : [{ id: "segment-1", kind: "work", label: "Bloque 1", start, end: null }],
    metrics: {
      activeSeconds: 0,
      workSeconds: 0,
      breakSeconds: 0,
      dailyGoalMinutes: 480,
      goalMet: false,
    },
    previousDay: {
      date: "2026-09-04",
      activeSeconds: 0,
      workSeconds: 0,
      breakSeconds: 0,
      dailyGoalMinutes: 480,
      goalMet: false,
    },
  };
}

function deferredSnapshot() {
  let resolve!: (value: trackerApi.TrackerSnapshot) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<trackerApi.TrackerSnapshot>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
