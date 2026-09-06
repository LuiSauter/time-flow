import { apiRequest } from "./api";

export const AUTH_STORAGE_KEY = "TimeFlow.auth.v1";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegistrationInput = AuthCredentials & { fullName: string };

export function saveStoredSession(session: AuthSession): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

export function loadStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken || isTokenExpired(session.accessToken)) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function canAccessPrivateRoute(): boolean {
  return typeof window !== "undefined" && loadStoredSession() !== null;
}

export function authHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const payload = decodeTokenPayload(token);
  return !payload || typeof payload.exp !== "number" || payload.exp * 1000 <= now;
}

export async function register(input: RegistrationInput): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/register", {
    body: input,
    method: "POST",
  });
}

export async function login(input: AuthCredentials): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/login", {
    body: input,
    method: "POST",
  });
}

export async function checkToken(accessToken: string): Promise<void> {
  await apiRequest<{ user: unknown }>("/auth/check-token", { accessToken });
}

function decodeTokenPayload(token: string): { exp?: unknown } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)) as { exp?: unknown };
  } catch {
    return null;
  }
}
