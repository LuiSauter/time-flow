import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Segment, TimerStatus } from "@/lib/tracker";

const STORAGE_KEY = "TimeFlow.session.v1";

export type TrackerState = {
  status: TimerStatus;
  projectId: string;
  /** Chronological blocks of the active journey. */
  segments: Segment[];
};

const initialState = (projectId: string): TrackerState => ({
  status: "IDLE",
  projectId,
  segments: [],
});

function load(projectId: string): TrackerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrackerState;
    if (!parsed || typeof parsed.status !== "string") return null;
    if (parsed.projectId !== projectId) return null;
    return parsed;
  } catch {
    return null;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Timer state machine: IDLE -> WORKING <-> PAUSED -> IDLE.
 * Elapsed time is always derived from absolute timestamps, so the counter stays
 * accurate across reloads, tab sleep and background time.
 */
export function useTimeTracker(projectId: string) {
  const [state, setState] = useState<TrackerState>(() => initialState(projectId));
  const [now, setNow] = useState(() => Date.now());
  const hydrated = useRef(false);

  // Rehydrate after mount (SSR-safe).
  useEffect(() => {
    const persisted = load(projectId);
    setState(persisted ?? initialState(projectId));
    hydrated.current = true;
  }, [projectId]);

  // Persist every transition.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  // 1s tick only while a segment is open.
  useEffect(() => {
    if (state.status === "IDLE") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state.status]);

  const closeOpen = (segments: Segment[], at: number) =>
    segments.map((s) => (s.end === null ? { ...s, end: at } : s));

  const startWork = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((prev) => {
      const workCount = prev.segments.filter((s) => s.kind === "work").length;
      return {
        ...prev,
        status: "WORKING",
        segments: [
          ...closeOpen(prev.segments, at),
          {
            id: uid(),
            kind: "work",
            label: `Bloque ${workCount + 1}`,
            start: at,
            end: null,
          },
        ],
      };
    });
  }, []);

  const startBreak = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((prev) => {
      const breakCount = prev.segments.filter((s) => s.kind === "break").length;
      return {
        ...prev,
        status: "PAUSED",
        segments: [
          ...closeOpen(prev.segments, at),
          {
            id: uid(),
            kind: "break",
            label: `Descanso ${breakCount + 1}`,
            start: at,
            end: null,
          },
        ],
      };
    });
  }, []);

  const finishDay = useCallback(() => {
    const at = Date.now();
    setState((prev) => ({
      ...prev,
      status: "IDLE",
      segments: closeOpen(prev.segments, at),
    }));
  }, []);

  const reset = useCallback(() => setState(initialState(projectId)), [projectId]);

  const addManual = useCallback((start: number, end: number) => {
    setState((prev) => {
      const workCount = prev.segments.filter((s) => s.kind === "work").length;
      return {
        ...prev,
        segments: [
          ...prev.segments,
          {
            id: uid(),
            kind: "work" as const,
            label: `Bloque ${workCount + 1} · Manual`,
            start,
            end,
          },
        ].sort((a, b) => a.start - b.start),
      };
    });
  }, []);

  const totals = useMemo(() => {
    let work = 0;
    let brk = 0;
    for (const s of state.segments) {
      const span = ((s.end ?? now) - s.start) / 1000;
      if (s.kind === "work") work += span;
      else brk += span;
    }
    const open = state.segments.find((s) => s.end === null);
    return {
      workSeconds: work,
      breakSeconds: brk,
      currentSeconds: open ? (now - open.start) / 1000 : 0,
    };
  }, [state.segments, now]);

  return { ...state, now, totals, startWork, startBreak, finishDay, addManual, reset };
}
