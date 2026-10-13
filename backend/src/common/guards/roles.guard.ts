import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../database/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Access denied: Authentication required.');
    }

    const userRole = (user.role || '').toUpperCase() as Role;
    const hasRole = requiredRoles.some((role) => role.toUpperCase() === userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: This action requires ${requiredRoles.join(' or ')} role privileges.`,
      );
    }

    return true;
  }
}

