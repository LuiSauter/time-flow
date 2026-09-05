import { useEffect, useSyncExternalStore } from "react";
import {
  checkToken,
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
  type AuthSession,
} from "@/lib/auth";

let session: AuthSession | null = null;
let status: AuthStatus = "loading";
let snapshot: AuthSnapshot = { session: null, status };
const serverSnapshot: AuthSnapshot = { session: null, status: "loading" };
let initialization: Promise<void> | null = null;
const listeners = new Set<() => void>();

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type AuthSnapshot = { session: AuthSession | null; status: AuthStatus };

export function useAuth() {
  const currentSnapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void initializeAuth();
  }, []);

  return {
    session: currentSnapshot.session,
    isAuthenticated: currentSnapshot.session !== null,
    status: currentSnapshot.status,
    setSession,
    clearSession,
  };
}

export function setSession(nextSession: AuthSession | null): void {
  session = nextSession;
  status = nextSession ? "authenticated" : "unauthenticated";
  snapshot = { session, status };
  if (nextSession) saveStoredSession(nextSession);
  else clearStoredSession();
  listeners.forEach((listener) => listener());
}

export function initializeAuth(): Promise<void> {
  if (initialization) return initialization;

  initialization = (async () => {
    const storedSession = loadStoredSession();
    if (!storedSession) {
      setSession(null);
      return;
    }

    try {
      await checkToken(storedSession.accessToken);
      setSession(storedSession);
    } catch {
      setSession(null);
    }
  })().finally(() => {
    initialization = null;
  });

  return initialization;
}

export function clearSession(): void {
  setSession(null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return serverSnapshot;
}
