import type { Request } from 'express';

export type AuthJwtPayload = {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = Request & {
  user: AuthJwtPayload;
};
