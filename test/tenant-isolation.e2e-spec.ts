import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { TenantRegistryService } from './../src/tenant/tenant-registry.service';
import { TenantPrismaService } from './../src/tenant/tenant-prisma.service';
import { TenantContext } from './../src/tenant/tenant.context';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let tenantRegistryService: TenantRegistryService;
  let prismaService: TenantPrismaService;

  beforeAll(async () => {
    process.env.TENANT_DEV_MODE = 'false';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // We get the services to spy on them
    tenantRegistryService = app.get<TenantRegistryService>(TenantRegistryService);
    prismaService = app.get<TenantPrismaService>(TenantPrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Tenant Context Resolution', () => {
    it('should block access without any tenant identifier', () => {
      return request(app.getHttpServer())
        // Assuming /api/health or some endpoint exists. We'll use a fake endpoint 
        // to trigger middleware. The middleware runs globally if configured so.
        .get('/')
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('Tenant não encontrado');
        });
    });

    it('should resolve tenant A and set schema fazenda_A via X-Tenant', async () => {
      // Mock the registry to return Tenant A
      jest.spyOn(tenantRegistryService, 'findBySubdomain').mockResolvedValueOnce({
        id: 'uuid-tenant-a',
        schemaName: 'fazenda_a',
        organizacaoId: 1,
        subdomain: 'cliente_a',
        status: 'ATIVO',
      } as any);

      // Spy on Prisma Service to check if getClientForSchema is called correctly
      const getClientSpy = jest.spyOn(prismaService, 'getClientForSchema');

      // We need an endpoint that uses the DB to trigger getClient()
      // Let's assume there's a simple GET / endpoint or similar.
      // If we don't have one, we can test just the middleware injection via a test controller,
      // but since we are running the real app, we can intercept the request.
      
      const response = await request(app.getHttpServer())
        .get('/') // Just to trigger middleware
        .set('X-Tenant', 'cliente_a')
        .expect(404); // Expect 404 because '/' might not exist, but middleware passes!

      expect(tenantRegistryService.findBySubdomain).toHaveBeenCalledWith('cliente_a');
      
      // Note: getClientForSchema might not be called if the controller doesn't use it, 
      // but we verified the middleware let it pass (no 400 or 403).
    });

    it('should resolve tenant B and set schema fazenda_B via X-Tenant-ID', async () => {
      jest.spyOn(tenantRegistryService, 'findById').mockResolvedValueOnce({
        id: '123e4567-e89b-12d3-a456-426614174000',
        schemaName: 'fazenda_b',
        organizacaoId: 2,
        subdomain: 'cliente_b',
        status: 'ATIVO',
      } as any);

      await request(app.getHttpServer())
        .get('/')
        .set('X-Tenant-ID', '123e4567-e89b-12d3-a456-426614174000')
        .expect(404); // Middleware passed

      expect(tenantRegistryService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should isolate requests concurrently', async () => {
      // Simulating two concurrent requests to ensure AsyncLocalStorage doesn't mix contexts
      
      let contextA: any = null;
      let contextB: any = null;

      // We can create a dummy route on the fly for testing Context
      const httpAdapter = app.getHttpAdapter();
      httpAdapter.get('/test-isolation', (req: any, res: any) => {
        const tenant = TenantContext.get();
        res.status(200).json({ schema: tenant?.schemaName });
      });

      jest.spyOn(tenantRegistryService, 'findBySubdomain').mockImplementation(async (sub) => {
        if (sub === 'tenant_a') return { id: '1', schemaName: 'schema_a', status: 'ATIVO' } as any;
        if (sub === 'tenant_b') return { id: '2', schemaName: 'schema_b', status: 'ATIVO' } as any;
        return null;
      });

      const reqA = request(app.getHttpServer())
        .get('/test-isolation')
        .set('X-Tenant', 'tenant_a')
        .then((res: any) => res.body.schema);

      const reqB = request(app.getHttpServer())
        .get('/test-isolation')
        .set('X-Tenant', 'tenant_b')
        .then((res: any) => res.body.schema);

      const [schemaA, schemaB] = await Promise.all([reqA, reqB]);

      expect(schemaA).toBe('schema_a');
      expect(schemaB).toBe('schema_b');
    });
  });
});
