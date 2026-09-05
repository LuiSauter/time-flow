import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppError, ErrorCode, toAppError } from './errors.js';

describe('errors', () => {
  it('creates a typed application error with a consistent response', () => {
    const error = new AppError({
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
      message: 'User not found',
      details: { resource: 'user' },
    });

    expect(error.getResponse()).toMatchObject({
      statusCode: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'User not found',
      details: { resource: 'user' },
    });
  });

  it('preserves NestJS HTTP errors', () => {
    const error = toAppError(
      new HttpException('Invalid request', HttpStatus.BAD_REQUEST),
    );

    expect(error.getResponse()).toMatchObject({
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid request',
    });
  });

  it('normalizes unknown errors without throwing', () => {
    const error = toAppError(new Error('Database unavailable'), 'Fallback');

    expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.getResponse()).toMatchObject({
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Database unavailable',
    });
  });

  it('normalizes non-error values using the fallback message', () => {
    const error = toAppError('unexpected value', 'Safe fallback');

    expect(error.getResponse()).toMatchObject({
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Safe fallback',
    });
  });
});
