const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  readonly timestamp: string | undefined;

  constructor(response: RemoteErrorResponse, fallbackStatus = 500) {
    super(normalizeMessage(response.message));
    this.name = "RemoteApiError";
    this.statusCode = response.statusCode ?? fallbackStatus;
    this.code = response.code ?? "INTERNAL_SERVER_ERROR";
    this.details = response.details;
    this.timestamp = response.timestamp;
  }
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
  if (options.accessToken) headers["Authorization"] = `Bearer ${options.accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
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
