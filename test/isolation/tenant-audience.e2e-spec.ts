import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
const request = require('supertest');
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { ResolveTenantContextUseCase } from '../../src/identity-access/application/use-cases/resolve-tenant-context.use-case';

@Controller('api/v1/animals')
class TestTenantController {
  @Get()
  getAnimals() {
    return { data: [] };
  }
}

class MockResolveTenantContext {
  async execute() {
    return {
      globalUserId: 'test-user',
      tenantId: 'tenant-1',
      organizationId: 1,
      localUserId: 1,
      farmId: 1,
      permissions: [],
    };
  }
}

describe('Tenant Audience Validation (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [TestTenantController],
      providers: [
        JwtStrategy,
        {
          provide: ResolveTenantContextUseCase,
          useClass: MockResolveTenantContext,
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  const generateTokenForAudience = (aud: string) => {
    const payload = {
      sub: 'test-user',
      email: 'test@example.com',
      nome: 'Test',
      tenantId: 'tenant-1',
      organizationId: 'organization-1',
      schemaName: 'schema-1',
      usuarioLocalId: 1,
      fazendaId: 1,
      role: 'COLABORADOR',
    };
    return jwtService.sign(payload, { audience: aud });
  };

  describe('Tenant Routes (/api/v1/* not admin)', () => {
    it('should REJECT token with admin audience (gado-admin)', () => {
      const token = generateTokenForAudience('gado-admin');

      return request(app.getHttpServer())
        .get('/api/v1/animals')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should ALLOW token with tenant audience (gado-tenant)', () => {
      const token = generateTokenForAudience('gado-tenant');

      return request(app.getHttpServer())
        .get('/api/v1/animals')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should REJECT an expired tenant token before context resolution', () => {
      const token = jwtService.sign(
        {
          sub: 'test-user',
          email: 'test@example.com',
          nome: 'Test',
          tenantId: 'tenant-1',
          organizationId: 'organization-1',
          fazendaId: 1,
          role: 'COLABORADOR',
        },
        { audience: 'gado-tenant', expiresIn: -1 },
      );

      return request(app.getHttpServer())
        .get('/api/v1/animals')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
