import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { ResolveTenantContextUseCase } from '../../identity-access/application/use-cases/resolve-tenant-context.use-case';
export interface JwtPayload {
    sub: string;
    email: string;
    nome: string;
    tenantId: string;
    schemaName?: string;
    usuarioLocalId?: number;
    fazendaId: number;
    role: string;
    permissoes?: string[];
    aud?: string | string[];
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly resolveTenantContext;
    constructor(configService: ConfigService, resolveTenantContext: ResolveTenantContextUseCase);
    validate(request: Request, payload: JwtPayload): Promise<{
        sub: string;
        email: string;
        nome: string;
        tenantId: string;
        organizationId: string;
        usuarioLocalId: number;
        fazendaId: number;
        role: string;
        permissoes: string[];
    }>;
    private transportTenantHint;
}
export {};
