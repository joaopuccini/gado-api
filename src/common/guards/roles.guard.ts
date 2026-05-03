import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

/**
 * Guard de autorização por roles.
 * Verifica se o usuário autenticado possui ao menos uma das roles exigidas.
 *
 * Se nenhuma role for definida com @Roles(), permite acesso (apenas auth é necessário).
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Se nenhuma role definida, permite (só precisa estar autenticado)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) return false;

        return requiredRoles.some((role) => {
            if (role === 'admin') return user.admin === true;
            if (role === 'suporte') return user.suporte === true;
            // Permissões granulares: acesso_animais, acesso_vendas, etc.
            return user.permissoes?.[role] === true;
        });
    }
}
