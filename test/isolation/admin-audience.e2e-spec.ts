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

// 1. Setup a dummy controller to test audience validation
@Controller('api/v1/admin')
class TestAdminController {
  @Get('dashboard')
  getAdminDashboard() {
    return { ok: true };
  }
}

// Dummy resolve context mock
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

describe('Admin Audience Validation (e2e)', () => {
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
      controllers: [TestAdminController],
      providers: [
        JwtStrategy,
        {
          provide: ResolveTenantContextUseCase,
          useClass: MockResolveTenantContext,
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard, // First authenticate
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

  // Helper to generate a token with a specific audience
  const generateTokenForAudience = (aud: string) => {
    const payload = {
      sub: 'test-user',
      email: 'test@example.com',
      nome: 'Test',
      tenantId: 'tenant-1',
      schemaName: 'schema-1',
      usuarioLocalId: 1,
      fazendaId: 1,
      role: 'COLABORADOR',
    };
    return jwtService.sign(payload, { audience: aud });
  };

  describe('Admin Routes (/api/v1/admin/*)', () => {
    it('should REJECT token with tenant audience (gado-tenant)', () => {
      const token = generateTokenForAudience('gado-tenant');

      return request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(401); // Unauthorized because audience is wrong
    });

    it('should ALLOW token with admin audience (gado-admin)', () => {
      const token = generateTokenForAudience('gado-admin');

      return request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
