import { Injectable, NestMiddleware, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantContext, TenantInfo } from './tenant.context';
import { TenantRegistryService } from './tenant-registry.service';

/** UUID v4 format validation regex */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly tenantRegistry: TenantRegistryService,
    private readonly configService: ConfigService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const origin = req.headers.origin || '';
    const xTenantHeader = (req.headers['x-tenant'] as string | undefined)?.trim();

    // 1. Tenta extrair do X-Tenant enviado pelo frontend
    // 2. Tenta extrair da URL de Origem (CORS)
    // 3. Tenta extrair do Host header
    let subdomain: string | null | undefined = xTenantHeader;

    if (!subdomain && origin) {
      try {
        const originUrl = new URL(origin);
        subdomain = this.extractSubdomain(originUrl.hostname);
      } catch (e) { }
    }

    if (!subdomain) {
      subdomain = this.extractSubdomain(host);
    }

    const tenantIdHeader = (req.headers['x-tenant-id'] as string | undefined)?.trim();

    // ─── Branch 1: Web — subdomain presente ───────────────────────────────────
    if (subdomain && subdomain !== 'api' && subdomain !== 'admin') {
      return this.resolveBySubdomain(subdomain, req, next);
    }

    // ─── Branch 2: JWT com tenantId (mobile pós-login) ───────────────────────
    const jwtTenant = this.extractTenantFromJwt(req);
    if (jwtTenant) {
      return this.resolveByJwtTenant(jwtTenant, req, next);
    }

    // ─── Branch 3: Mobile — header X-Tenant-ID (pré-login / fallback) ────────
    if (tenantIdHeader) {
      return this.resolveByTenantIdHeader(tenantIdHeader, req, next);
    }

    // ─── Branch 4: Dev mode / fallback ────────────────────────────────────────
    const devEnabled = this.configService.get<string>('TENANT_DEV_MODE', 'true');
    if (devEnabled === 'true') {
      this.logger.debug('Dev mode: usando schema default sem tenant');
      return next();
    }

    throw new BadRequestException('Tenant não encontrado — subdomain, JWT ou X-Tenant-ID não identificado');
  }

  // ─── Resolução Web (subdomain) ───────────────────────────────────────────────

  private async resolveBySubdomain(subdomain: string, req: Request, next: NextFunction) {
    const tenant = await this.tenantRegistry.findBySubdomain(subdomain);

    if (!tenant) {
      this.logger.warn(`[web] Tenant não encontrado para subdomain: ${subdomain}`);
      throw new BadRequestException('Tenant não encontrado');
    }

    this.validateTenantStatus(tenant.status, `subdomain:${subdomain}`);

    const tenantInfo: TenantInfo = {
      tenantId: tenant.id,
      schemaName: tenant.schemaName,
      organizacaoId: tenant.organizacaoId,
      subdomain: tenant.subdomain,
      status: tenant.status,
      resolvedVia: 'subdomain',
    };

    req.tenant = tenantInfo;
    TenantContext.run(tenantInfo, () => next());
  }

  // ─── Resolução Mobile (X-Tenant-ID header) ──────────────────────────────────

  private async resolveByTenantIdHeader(tenantIdHeader: string, req: Request, next: NextFunction) {
    if (!UUID_REGEX.test(tenantIdHeader)) {
      this.logger.warn(`[mobile] X-Tenant-ID com formato inválido: ${tenantIdHeader}`);
      throw new BadRequestException('X-Tenant-ID inválido — formato UUID esperado');
    }

    const tenant = await this.tenantRegistry.findById(tenantIdHeader);

    if (!tenant) {
      this.logger.warn(`[mobile] Tenant não encontrado para id: ${tenantIdHeader}`);
      throw new BadRequestException('Tenant não encontrado');
    }

    this.validateTenantStatus(tenant.status, `id:${tenantIdHeader}`);

    const tenantInfo: TenantInfo = {
      tenantId: tenant.id,
      schemaName: tenant.schemaName,
      organizacaoId: tenant.organizacaoId,
      subdomain: tenant.subdomain,
      status: tenant.status,
      resolvedVia: 'header',
    };

    req.tenant = tenantInfo;
    TenantContext.run(tenantInfo, () => next());
  }

  // ─── Resolução Mobile via JWT (token com tenantId embutido) ────────────────

  private extractTenantFromJwt(req: Request): { tenantId: string; schemaName: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(
        Buffer.from(payloadBase64, 'base64').toString('utf8'),
      );

      if (decoded.tenantId && decoded.schemaName) {
        return { tenantId: decoded.tenantId, schemaName: decoded.schemaName };
      }
    } catch (e: any) {
      this.logger.error(`Erro ao decodificar JWT no middleware: ${e.message}`);
    }
    return null;
  }

  private async resolveByJwtTenant(
    jwtTenant: { tenantId: string; schemaName: string },
    req: Request,
    next: NextFunction,
  ) {
    if (!UUID_REGEX.test(jwtTenant.tenantId)) {
      this.logger.warn(`[jwt] tenantId com formato inválido no token: ${jwtTenant.tenantId}`);
      return null;
    }

    const tenant = await this.tenantRegistry.findById(jwtTenant.tenantId);

    if (!tenant) {
      this.logger.warn(`[jwt] Tenant do token não encontrado: ${jwtTenant.tenantId}`);
      throw new BadRequestException('Tenant não encontrado');
    }

    this.validateTenantStatus(tenant.status, `jwt:${jwtTenant.tenantId}`);

    const tenantInfo: TenantInfo = {
      tenantId: tenant.id,
      schemaName: tenant.schemaName,
      organizacaoId: tenant.organizacaoId,
      subdomain: tenant.subdomain,
      status: tenant.status,
      resolvedVia: 'jwt',
    };

    req.tenant = tenantInfo;
    TenantContext.run(tenantInfo, () => next());
  }

  // ─── Validação de status (compartilhada) ────────────────────────────────────

  private validateTenantStatus(status: string, identifier: string): void {
    if (status === 'BLOQUEADO') {
      this.logger.warn(`Tenant bloqueado: ${identifier}`);
      throw new ForbiddenException('Organização suspensa. Entre em contato com o suporte.');
    }

    if (status === 'REMOVIDO') {
      throw new BadRequestException('Tenant não encontrado');
    }

    if (status !== 'ATIVO' && status !== 'PROVISIONANDO') {
      this.logger.warn(`Tenant em status inválido: ${identifier} (${status})`);
      throw new ForbiddenException('Organização indisponível. Tente novamente mais tarde.');
    }
  }

  private extractSubdomain(host: string): string | null {
    const hostname = host.split(':')[0];
    const baseDomain = this.configService.get<string>('TENANT_BASE_DOMAIN', 'gado.com.br');

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
}
