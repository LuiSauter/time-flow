import { JwtService } from '@nestjs/jwt';
import type { ExecutionContext } from '@nestjs/common';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';

function contextWithHeaders(headers: Record<string, string>): ExecutionContext {
  const request = { headers } as { headers: Record<string, string>; user?: unknown };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  it('rejects a request without a bearer token', async () => {
    const guard = new AuthGuard({ verifyAsync: vi.fn() } as unknown as JwtService);

    await expect(guard.canActivate(contextWithHeaders({}))).rejects.toMatchObject({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    } satisfies Partial<AppError>);
  });

  it('rejects an invalid bearer token', async () => {
    const jwt = { verifyAsync: vi.fn().mockRejectedValue(new Error('invalid')) };
    const guard = new AuthGuard(jwt as unknown as JwtService);

    await expect(
      guard.canActivate(contextWithHeaders({ authorization: 'Bearer invalid' })),
    ).rejects.toMatchObject({ status: 401, code: ErrorCode.UNAUTHORIZED } satisfies Partial<AppError>);
  });

  it('attaches the verified payload to a valid request', async () => {
    const payload = { sub: 'user-id', email: 'diego@example.com' };
    const jwt = { verifyAsync: vi.fn().mockResolvedValue(payload) };
    const guard = new AuthGuard(jwt as unknown as JwtService);
    const context = contextWithHeaders({ authorization: 'Bearer valid' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('valid');
    const request = context.switchToHttp().getRequest() as AuthenticatedRequest;
    expect(request.user).toEqual(payload);
    expect(request.user.sub).toBe('user-id');
    expect(request.user.email).toBe('diego@example.com');
  });
});
