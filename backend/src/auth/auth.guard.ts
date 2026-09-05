import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppError, ErrorCode } from '../common/errors/errors.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;

    if (!token) {
      throw this.unauthorized();
    }

    try {
      request.user = await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private unauthorized(): AppError {
    return new AppError({
      statusCode: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'La autenticación no es válida',
    });
  }
}
