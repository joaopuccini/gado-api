import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const userPermissions: string[] = user.permissoes || [];

    const hasPermission = requiredPermissions.every((permission) => {
      if (userPermissions.includes(permission)) return true;
      
      // Fallback: Check if user has 'gerenciar' permission for the module
      const [module] = permission.split(':');
      const manageAllPermission = `${module}:gerenciar`;
      return userPermissions.includes(manageAllPermission);
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso negado. Permissões necessárias: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
