import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  addManualEntry,
  finishTracker,
  getTracker,
  pauseTracker,
  resumeTracker,
  startTracker,
  type TrackerSnapshot,
  type TimerStatus,
  type PreviousDayScope,
  type ManualEntryInput,
} from "@/lib/tracker";
import type { Segment } from "@/lib/tracker";

export type TrackerState = {
  status: TimerStatus;
  projectId: string;
  /** Chronological blocks of the active journey. */
  segments: Segment[];
};

type Transition = (accessToken: string, projectId: string) => Promise<TrackerSnapshot>;

const initialState = (projectId: string): TrackerState => ({
  status: "IDLE",
  projectId,
  segments: [],
});

/**
 * Projects the persisted snapshot into the timer shape used by the UI.
 * Epoch timestamps keep the clock independent from render frequency.
 */
function toTrackerState(projectId: string, snapshot: TrackerSnapshot): TrackerState {
  return {
    projectId,
    status: snapshot.status,
    segments: snapshot.segments.map((segment) => ({
      id: segment.id,
      kind: segment.kind,
      label: segment.label,
      start: new Date(segment.start).getTime(),
      end: segment.end ? new Date(segment.end).getTime() : null,
    })),
  };
}

/**
 * Timer state machine: IDLE -> WORKING <-> PAUSED -> IDLE.
 * The backend is authoritative; the local clock only projects open timestamps.
 */
export function useTimeTracker(projectId: string, previousDayScope: PreviousDayScope = "all") {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const [state, setState] = useState<TrackerState>(() => initialState(projectId));
  const [now, setNow] = useState(() => Date.now());
  const [isPending, setIsPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    data: trackerSnapshot,
    error: trackerError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tracker", accessToken, projectId, previousDayScope],
    queryFn: () => getTracker(accessToken!, projectId, previousDayScope),
    enabled: accessToken !== null,
  });

  useEffect(() => {
    setActionError(null);
    setState(initialState(projectId));
    if (trackerSnapshot) {
      setState(toTrackerState(projectId, trackerSnapshot));
      setNow(Date.now());
    }
  }, [projectId, trackerSnapshot]);

  useEffect(() => {
    if (state.status === "IDLE") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => {
      setNow(Date.now());
      void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch, state.status]);

  const transition = useCallback(
    async (operation: Transition) => {
      if (!accessToken || isPending) return;
      setIsPending(true);
      setActionError(null);
      try {
        const snapshot = await operation(accessToken, projectId);
        setState(toTrackerState(projectId, snapshot));
        setNow(Date.now());
        await refetch();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "No se pudo guardar el cambio");
      } finally {
        setIsPending(false);
      }
    },
    [accessToken, isPending, projectId, refetch],
  );

  const startWork = useCallback(
    () => transition(state.status === "PAUSED" ? resumeTracker : startTracker),
    [state.status, transition],
  );
  const startBreak = useCallback(() => transition(pauseTracker), [transition]);
  const resumeWork = useCallback(() => transition(resumeTracker), [transition]);
  const finishDay = useCallback(() => transition(finishTracker), [transition]);
  const reset = useCallback(() => {
    setState(initialState(projectId));
    void refetch();
  }, [projectId, refetch]);

  const addManual = useCallback(
    (input: ManualEntryInput) =>
      transition((token, selectedProjectId) => addManualEntry(token, selectedProjectId, input)),
    [transition],
  );

  const totals = useMemo(() => {
    let work = 0;
    let brk = 0;
    for (const segment of state.segments) {
      const span = ((segment.end ?? now) - segment.start) / 1000;
      if (segment.kind === "work") work += span;
      else brk += span;
    }
    const open = state.segments.find((segment) => segment.end === null);
    return {
      workSeconds: work,
      breakSeconds: brk,
      currentSeconds: open ? (now - open.start) / 1000 : 0,
    };
  }, [now, state.segments]);

  return {
    ...state,
    now,
    totals,
    isLoading,
    isPending,
    error: actionError ?? errorMessage(trackerError),
    metrics: trackerSnapshot?.metrics ?? null,
    previousDay: trackerSnapshot?.previousDay ?? null,
    startWork,
    startBreak,
    resumeWork,
    finishDay,
    addManual,
    reset,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}
