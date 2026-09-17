"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const resolve_tenant_context_use_case_1 = require("../../identity-access/application/use-cases/resolve-tenant-context.use-case");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    resolveTenantContext;
    constructor(configService, resolveTenantContext) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_SECRET'),
            passReqToCallback: true,
        });
        this.configService = configService;
        this.resolveTenantContext = resolveTenantContext;
    }
    async validate(request, payload) {
        const path = request.path || request.url;
        const isAdminRoute = path.startsWith('/api/v1/admin');
        const audiences = Array.isArray(payload.aud)
            ? payload.aud
            : payload.aud
                ? [payload.aud]
                : [];
        if (isAdminRoute && !audiences.includes('gado-admin')) {
            throw new common_1.UnauthorizedException('Token inválido para rotas administrativas');
        }
        if (isAdminRoute) {
            return {
                sub: payload.sub,
                email: payload.email,
                nome: payload.nome,
                role: payload.role,
            };
        }
        if (!audiences.includes('gado-tenant')) {
            throw new common_1.UnauthorizedException('Token inválido para rotas de tenant');
        }
        if (!payload.sub?.trim() ||
            !payload.tenantId?.trim() ||
            !payload.organizationId?.trim() ||
            !Number.isInteger(payload.fazendaId) ||
            payload.fazendaId <= 0) {
            throw new common_1.UnauthorizedException('Token operacional incompleto');
        }
        const context = await this.resolveTenantContext.execute({
            verifiedSubject: payload.sub,
            verifiedOrganizationId: payload.organizationId,
            tenantId: payload.tenantId,
            requestedFarmId: Number(payload.fazendaId),
            requestedSchemaName: payload.schemaName,
            hostTenant: this.transportTenantHint(request),
        });
        return {
            sub: context.globalUserId,
            email: payload.email,
            nome: payload.nome,
            tenantId: context.tenantId,
            organizationId: context.organizationId,
            usuarioLocalId: context.localUserId,
            fazendaId: context.farmId,
            role: payload.role,
            permissoes: [...context.permissions],
        };
    }
    transportTenantHint(request) {
        const header = request.headers['x-tenant'];
        if (typeof header === 'string' && header.trim()) {
            return header.trim().toLowerCase();
        }
        const hostname = request.hostname.toLowerCase();
        const baseDomain = this.configService
            .get('TENANT_BASE_DOMAIN', 'gado.com.br')
            .toLowerCase();
        if (!hostname.endsWith(`.${baseDomain}`))
            return undefined;
        const subdomain = hostname.slice(0, -(baseDomain.length + 1));
        return subdomain && !subdomain.includes('.') ? subdomain : undefined;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        resolve_tenant_context_use_case_1.ResolveTenantContextUseCase])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map