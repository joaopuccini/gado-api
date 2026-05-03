import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
interface JwtPayload {
    sub: number;
    email: string;
    nome: string;
    admin: boolean;
    suporte: boolean;
    fazendaId: number;
    permissoes: Record<string, boolean>;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): {
        id: number;
        email: string;
        nome: string;
        admin: boolean;
        suporte: boolean;
        fazendaId: number;
        permissoes: Record<string, boolean>;
    };
}
export {};
