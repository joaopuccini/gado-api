import { Test, TestingModule } from '@nestjs/testing';
import { TenantMiddleware } from './tenant.middleware';
import { TenantRegistryService } from './tenant-registry.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantContext } from './tenant.context';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let tenantRegistry: jest.Mocked<TenantRegistryService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMiddleware,
        {
          provide: TenantRegistryService,
          useValue: {
            findBySubdomain: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue: string) => {
              if (key === 'TENANT_DEV_MODE') return 'false';
              if (key === 'TENANT_BASE_DOMAIN') return 'gado.com.br';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
    tenantRegistry = module.get(TenantRegistryService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (headers: any = {}): Request => {
    return {
      headers,
    } as unknown as Request;
  };

  const mockResponse = (): Response => ({} as Response);
  const nextFunction = jest.fn();

  describe('Subdomain Resolution', () => {
    it('should resolve tenant via x-tenant header', async () => {
      const req = mockRequest({ 'x-tenant': 'fazenda1' });
      const res = mockResponse();
      
      tenantRegistry.findBySubdomain.mockResolvedValue({
        id: '123',
        schemaName: 'fazenda_123',
        organizacaoId: 1,
        subdomain: 'fazenda1',
        status: 'ATIVO',
      } as any);

      await middleware.use(req, res, nextFunction);

      expect(tenantRegistry.findBySubdomain).toHaveBeenCalledWith('fazenda1');
      expect(req.tenant).toBeDefined();
      expect(req.tenant?.subdomain).toBe('fazenda1');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should resolve tenant via Host header', async () => {
      const req = mockRequest({ 'host': 'minhafazenda.gado.com.br' });
      const res = mockResponse();

      tenantRegistry.findBySubdomain.mockResolvedValue({
        id: 'uuid-1',
        schemaName: 'fazenda_uuid_1',
        organizacaoId: 2,
        subdomain: 'minhafazenda',
        status: 'ATIVO',
      } as any);

      await middleware.use(req, res, nextFunction);

      expect(tenantRegistry.findBySubdomain).toHaveBeenCalledWith('minhafazenda');
      expect(req.tenant?.subdomain).toBe('minhafazenda');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant not found by subdomain', async () => {
      const req = mockRequest({ 'x-tenant': 'notfound' });
      const res = mockResponse();
      
      tenantRegistry.findBySubdomain.mockResolvedValue(null);

      await expect(middleware.use(req, res, nextFunction)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if tenant is blocked', async () => {
      const req = mockRequest({ 'x-tenant': 'blocked_tenant' });
      const res = mockResponse();
      
      tenantRegistry.findBySubdomain.mockResolvedValue({
        id: '123',
        schemaName: 'fazenda_123',
        organizacaoId: 1,
        subdomain: 'blocked_tenant',
        status: 'BLOQUEADO',
      } as any);

      await expect(middleware.use(req, res, nextFunction)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Tenant ID Header Resolution (Mobile)', () => {
    it('should resolve tenant via x-tenant-id header with valid UUID', async () => {
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      const req = mockRequest({ 'x-tenant-id': validUuid });
      const res = mockResponse();

      tenantRegistry.findById.mockResolvedValue({
        id: validUuid,
        schemaName: 'fazenda_uuid',
        organizacaoId: 1,
        subdomain: 'mobile-tenant',
        status: 'ATIVO',
      } as any);

      await middleware.use(req, res, nextFunction);

      expect(tenantRegistry.findById).toHaveBeenCalledWith(validUuid);
      expect(req.tenant?.tenantId).toBe(validUuid);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if x-tenant-id is invalid UUID', async () => {
      const req = mockRequest({ 'x-tenant-id': 'invalid-uuid' });
      const res = mockResponse();

      await expect(middleware.use(req, res, nextFunction)).rejects.toThrow(BadRequestException);
      expect(tenantRegistry.findById).not.toHaveBeenCalled();
    });
  });

  describe('Dev Mode', () => {
    it('should fallback to dev mode if no headers present and TENANT_DEV_MODE is true', async () => {
      configService.get.mockImplementation((key: string, defaultValue: string) => {
        if (key === 'TENANT_DEV_MODE') return 'true';
        return defaultValue;
      });

      const req = mockRequest();
      const res = mockResponse();

      await middleware.use(req, res, nextFunction);

      expect(req.tenant).toBeUndefined(); // no tenant injected
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should throw if no headers and TENANT_DEV_MODE is false', async () => {
      configService.get.mockImplementation((key: string, defaultValue: string) => {
        if (key === 'TENANT_DEV_MODE') return 'false';
        return defaultValue;
      });

      const req = mockRequest();
      const res = mockResponse();

      await expect(middleware.use(req, res, nextFunction)).rejects.toThrow(BadRequestException);
    });
  });
});
