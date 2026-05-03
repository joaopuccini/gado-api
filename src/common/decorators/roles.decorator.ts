import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles necessárias em um endpoint.
 * Uso: @Roles('admin', 'suporte')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
