export const AUTH_STORAGE_KEY = "TimeFlow.auth.v1";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export type RemoteErrorResponse = {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  details?: unknown;
  timestamp?: string;
};

export class RemoteApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;
  readonly timestamp?: string;

  constructor(response: RemoteErrorResponse, fallbackStatus = 500) {
    super(normalizeMessage(response.message));
    this.name = "RemoteApiError";
    this.statusCode = response.statusCode ?? fallbackStatus;
    this.code = response.code ?? "INTERNAL_SERVER_ERROR";
    this.details = response.details;
    this.timestamp = response.timestamp;
  }
}

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

export type ApiRequestOptions = {
  accessToken?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  headers["Content-Type"] = "application/json";
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new RemoteApiError(
      { code: "NETWORK_ERROR", message: "No se pudo conectar con el servidor" },
      0,
    );
  }

  const rawBody = await response.text();
  let body: unknown;
  try {
    body = rawBody ? (JSON.parse(rawBody) as unknown) : undefined;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new RemoteApiError(isRemoteErrorResponse(body) ? body : {}, response.status);
  }
  return body as T;
}

function isRemoteErrorResponse(value: unknown): value is RemoteErrorResponse {
  return typeof value === "object" && value !== null;
}

function normalizeMessage(message: string | string[] | undefined) {
  if (Array.isArray(message)) return message.filter(Boolean).join("; ");
  return message?.trim() || "Ha ocurrido un error";
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
