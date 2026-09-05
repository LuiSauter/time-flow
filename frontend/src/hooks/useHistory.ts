import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "./useAuth";
import {
  getHistory,
  setDailyRateOverride,
  setProjectRate,
  type DailyRateOverrideResponse,
  type HistoryFilters,
  type HourlyRateInput,
  type ProjectRateResponse,
} from "@/lib/tracker";

export type { HistoryFilters } from "@/lib/tracker";

type RateMutationInput = { projectId: string } & HourlyRateInput;
type DailyRateMutationInput = RateMutationInput & { date: string };
type HistoryOptions = { enabled?: boolean };

const defaultHistoryFilters: HistoryFilters = {
  period: "month",
  onlyWeekdays: true,
  projectId: null,
};

export function useHistory(
  initialFilters: HistoryFilters = defaultHistoryFilters,
  options: HistoryOptions = {},
) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const historyQuery = useQuery({
    queryKey: ["history", accessToken, filters],
    queryFn: () => getHistory(accessToken!, filters),
    enabled: accessToken !== null && options.enabled !== false,
  });

  const invalidateHistory = () => {
    void queryClient.invalidateQueries({ queryKey: ["projects", accessToken] });
    void queryClient.invalidateQueries({ queryKey: ["history", accessToken] });
  };

  const rateMutation = useMutation<ProjectRateResponse, Error, RateMutationInput>({
    mutationFn: ({ projectId, hourlyRate }) => {
      if (!accessToken) throw new Error("No hay una sesión autenticada");
      return setProjectRate(accessToken, projectId, { hourlyRate });
    },
    onSuccess: invalidateHistory,
  });

  const dailyOverrideMutation = useMutation<
    DailyRateOverrideResponse,
    Error,
    DailyRateMutationInput
  >({
    mutationFn: ({ projectId, date, hourlyRate }) => {
      if (!accessToken) throw new Error("No hay una sesión autenticada");
      return setDailyRateOverride(accessToken, projectId, date, { hourlyRate });
    },
    onSuccess: invalidateHistory,
  });

  return {
    ...historyQuery,
    filters,
    setFilters,
    isEmpty: historyQuery.data ? historyQuery.data.rows.length === 0 : false,
    saveRate: rateMutation.mutateAsync,
    saveDailyOverride: dailyOverrideMutation.mutateAsync,
    isSavingRate: rateMutation.isPending,
    isSavingDailyOverride: dailyOverrideMutation.isPending,
    rateError: rateMutation.error,
    dailyOverrideError: dailyOverrideMutation.error,
  };
}
