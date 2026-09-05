import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ErrorResponse<T = unknown> {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: T;
  timestamp: string;
}

export interface AppErrorOptions<T = unknown> {
  statusCode?: HttpStatus;
  code?: ErrorCode;
  message: string;
  details?: T;
  cause?: unknown;
}

export class AppError<T = unknown> extends HttpException {
  readonly code: ErrorCode;
  readonly details?: T;
  readonly originalCause?: unknown;
  readonly timestamp: string;

  constructor(options: AppErrorOptions<T>) {
    const statusCode = options.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    super(options.message, statusCode, { cause: options.cause });
    this.code = options.code ?? codeFromStatus(statusCode);
    this.details = options.details;
    this.originalCause = options.cause;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }

  override getResponse(): ErrorResponse<T> {
    return {
      statusCode: this.getStatus(),
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
      timestamp: this.timestamp,
    };
  }
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function toAppError(
  error: unknown,
  fallbackMessage = 'Internal Server Error',
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof HttpException) {
    const response = error.getResponse();
    const message = getResponseMessage(response, error.message);

    return new AppError({
      statusCode: error.getStatus(),
      code: codeFromStatus(error.getStatus()),
      message,
      cause: error,
    });
  }

  if (isAxiosError(error)) {
    const statusCode = error.response?.status ?? HttpStatus.BAD_GATEWAY;
    return new AppError({
      statusCode,
      code: codeFromStatus(statusCode),
      message: getResponseMessage(error.response?.data, fallbackMessage),
      cause: error,
    });
  }

  return new AppError({
    message: isError(error) ? error.message : fallbackMessage,
    cause: error,
  });
}

interface AxiosLikeError {
  isAxiosError: boolean;
  response?: {
    status?: number;
    data?: unknown;
  };
}

function isAxiosError(error: unknown): error is AxiosLikeError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

function getResponseMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = value.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    if (
      Array.isArray(message) &&
      message.every((item): item is string => typeof item === 'string')
    ) {
      const messages = message.map((item) => item.trim()).filter(Boolean);
      if (messages.length > 0) return messages.join('; ');
    }
  }

  return fallback;
}

function codeFromStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return ErrorCode.UNPROCESSABLE_ENTITY;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return statusCode >= 500
        ? ErrorCode.INTERNAL_SERVER_ERROR
        : ErrorCode.BAD_REQUEST;
  }
}
