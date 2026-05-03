import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o fazendaId do JWT payload.
 * Uso: @CurrentFazenda() fazendaId: number
 *
 * Substitui process.env.FAZENDA (race condition) por um valor
 * isolado por request via JWT payload.
 */
export const CurrentFazenda = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): number => {
        const request = ctx.switchToHttp().getRequest();
        return request.user?.fazendaId;
    },
);
