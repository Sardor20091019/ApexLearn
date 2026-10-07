import { Request } from 'express';
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
}
