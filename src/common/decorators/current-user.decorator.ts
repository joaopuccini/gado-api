import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
    id: number;
    email: string;
    nome: string;
    admin: boolean;
    suporte: boolean;
    fazendaId: number;
    permissoes: Record<string, boolean>;
}

/**
 * Decorator para extrair o usuário autenticado da request.
 * Uso: @CurrentUser() user: CurrentUserData
 */
export const CurrentUser = createParamDecorator(
    (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | unknown => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as CurrentUserData;
        return data ? user?.[data] : user;
    },
);
