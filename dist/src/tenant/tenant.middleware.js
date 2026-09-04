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
var TenantMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tenant_context_1 = require("./tenant.context");
const tenant_registry_service_1 = require("./tenant-registry.service");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let TenantMiddleware = TenantMiddleware_1 = class TenantMiddleware {
    tenantRegistry;
    configService;
    logger = new common_1.Logger(TenantMiddleware_1.name);
    constructor(tenantRegistry, configService) {
        this.tenantRegistry = tenantRegistry;
        this.configService = configService;
    }
    async use(req, res, next) {
        const host = req.headers.host || '';
        const origin = req.headers.origin || '';
        const xTenantHeader = req.headers['x-tenant']?.trim();
        let subdomain = xTenantHeader;
        if (!subdomain && origin) {
            try {
                const originUrl = new URL(origin);
                subdomain = this.extractSubdomain(originUrl.hostname);
            }
            catch (e) { }
        }
        if (!subdomain) {
            subdomain = this.extractSubdomain(host);
        }
        const tenantIdHeader = req.headers['x-tenant-id']?.trim();
        if (subdomain && subdomain !== 'api' && subdomain !== 'admin') {
            return this.resolveBySubdomain(subdomain, req, next);
        }
        const jwtTenant = this.extractTenantFromJwt(req);
        if (jwtTenant) {
            return this.resolveByJwtTenant(jwtTenant, req, next);
        }
        if (tenantIdHeader) {
            return this.resolveByTenantIdHeader(tenantIdHeader, req, next);
        }
        const devEnabled = this.configService.get('TENANT_DEV_MODE', 'true');
        if (devEnabled === 'true') {
            this.logger.debug('Dev mode: usando schema default sem tenant');
            return next();
        }
        throw new common_1.BadRequestException('Tenant não encontrado — subdomain, JWT ou X-Tenant-ID não identificado');
    }
    async resolveBySubdomain(subdomain, req, next) {
        const tenant = await this.tenantRegistry.findBySubdomain(subdomain);
        if (!tenant) {
            this.logger.warn(`[web] Tenant não encontrado para subdomain: ${subdomain}`);
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        this.validateTenantStatus(tenant.status, `subdomain:${subdomain}`);
        const tenantInfo = {
            tenantId: tenant.id,
            schemaName: tenant.schemaName,
            organizacaoId: tenant.organizacaoId,
            subdomain: tenant.subdomain,
            status: tenant.status,
            resolvedVia: 'subdomain',
        };
        req.tenant = tenantInfo;
        tenant_context_1.TenantContext.run(tenantInfo, () => next());
    }
    async resolveByTenantIdHeader(tenantIdHeader, req, next) {
        if (!UUID_REGEX.test(tenantIdHeader)) {
            this.logger.warn(`[mobile] X-Tenant-ID com formato inválido: ${tenantIdHeader}`);
            throw new common_1.BadRequestException('X-Tenant-ID inválido — formato UUID esperado');
        }
        const tenant = await this.tenantRegistry.findById(tenantIdHeader);
        if (!tenant) {
            this.logger.warn(`[mobile] Tenant não encontrado para id: ${tenantIdHeader}`);
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        this.validateTenantStatus(tenant.status, `id:${tenantIdHeader}`);
        const tenantInfo = {
            tenantId: tenant.id,
            schemaName: tenant.schemaName,
            organizacaoId: tenant.organizacaoId,
            subdomain: tenant.subdomain,
            status: tenant.status,
            resolvedVia: 'header',
        };
        req.tenant = tenantInfo;
        tenant_context_1.TenantContext.run(tenantInfo, () => next());
    }
    extractTenantFromJwt(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer '))
            return null;
        try {
            const token = authHeader.substring(7);
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            if (decoded.tenantId && decoded.schemaName) {
                return { tenantId: decoded.tenantId, schemaName: decoded.schemaName };
            }
        }
        catch (e) {
            this.logger.error(`Erro ao decodificar JWT no middleware: ${e.message}`);
        }
        return null;
    }
    async resolveByJwtTenant(jwtTenant, req, next) {
        if (!UUID_REGEX.test(jwtTenant.tenantId)) {
            this.logger.warn(`[jwt] tenantId com formato inválido no token: ${jwtTenant.tenantId}`);
            return null;
        }
        const tenant = await this.tenantRegistry.findById(jwtTenant.tenantId);
        if (!tenant) {
            this.logger.warn(`[jwt] Tenant do token não encontrado: ${jwtTenant.tenantId}`);
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        this.validateTenantStatus(tenant.status, `jwt:${jwtTenant.tenantId}`);
        const tenantInfo = {
            tenantId: tenant.id,
            schemaName: tenant.schemaName,
            organizacaoId: tenant.organizacaoId,
            subdomain: tenant.subdomain,
            status: tenant.status,
            resolvedVia: 'jwt',
        };
        req.tenant = tenantInfo;
        tenant_context_1.TenantContext.run(tenantInfo, () => next());
    }
    validateTenantStatus(status, identifier) {
        if (status === 'BLOQUEADO') {
            this.logger.warn(`Tenant bloqueado: ${identifier}`);
            throw new common_1.ForbiddenException('Organização suspensa. Entre em contato com o suporte.');
        }
        if (status === 'REMOVIDO') {
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        if (status !== 'ATIVO' && status !== 'PROVISIONANDO') {
            this.logger.warn(`Tenant em status inválido: ${identifier} (${status})`);
            throw new common_1.ForbiddenException('Organização indisponível. Tente novamente mais tarde.');
        }
    }
    extractSubdomain(host) {
        const hostname = host.split(':')[0];
        const baseDomain = this.configService.get('TENANT_BASE_DOMAIN', 'gado.com.br');
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return null;
        }
        if (!hostname.endsWith(baseDomain)) {
            return null;
        }
        const subdomain = hostname.slice(0, -(baseDomain.length + 1));
        if (!subdomain || subdomain.includes('.')) {
            return null;
        }
        return subdomain.toLowerCase();
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = TenantMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_registry_service_1.TenantRegistryService,
        config_1.ConfigService])
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map