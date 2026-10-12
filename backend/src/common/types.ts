import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';
import { Role } from '../database/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  sub?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  headers: IncomingHttpHeaders;
}
