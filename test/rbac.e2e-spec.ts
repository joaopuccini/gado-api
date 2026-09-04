import { Controller, Get, Post, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
const request = require('supertest');
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { RequirePermissions } from '../src/auth/decorators/permissions.decorator';
import { FazendaRole, getPermissionsForRole } from '../src/common/rbac/rbac.config';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

// 1. Setup a dummy controller to test the RBAC rules
@Controller('test-rbac')
class TestRbacController {
  @Get('ler-animais')
  @RequirePermissions('animais:ler')
  lerAnimais() {
    return { ok: true };
  }

  @Post('criar-animais')
  @RequirePermissions('animais:criar')
  criarAnimais() {
    return { ok: true };
  }

  @Post('gerenciar-animais')
  @RequirePermissions('animais:gerenciar')
  gerenciarAnimais() {
    return { ok: true };
  }
}

describe('RBAC Permissions (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ({ JWT_SECRET: 'test-secret' })] }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [TestRbacController],
      providers: [
        JwtStrategy,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard, // First authenticate
        },
        {
          provide: APP_GUARD,
          useClass: PermissionsGuard, // Then check permissions
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to generate a token for a given role
  const generateTokenForRole = (role: FazendaRole) => {
    const permissoes = getPermissionsForRole(role);
    const payload = {
      sub: 'test-user',
      email: 'test@example.com',
      nome: 'Test',
      tenantId: 'tenant-1',
      schemaName: 'schema-1',
      usuarioLocalId: 1,
      fazendaId: 1,
      role,
      permissoes,
    };
    return jwtService.sign(payload);
  };

  describe('Role: COLABORADOR', () => {
    let token: string;

    beforeAll(() => {
      token = generateTokenForRole(FazendaRole.COLABORADOR);
    });

    it('should ALLOW accessing animais:ler', () => {
      return request(app.getHttpServer())
        .get('/test-rbac/ler-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should ALLOW accessing animais:criar', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/criar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });

    it('should DENY accessing animais:gerenciar', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/gerenciar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Role: GESTOR', () => {
    let token: string;

    beforeAll(() => {
      token = generateTokenForRole(FazendaRole.GESTOR);
    });

    // THIS MIGHT FAIL IN CURRENT IMPLEMENTATION (BUG DISCOVERED)
    // GESTOR has 'animais:gerenciar' but not explicitly 'animais:ler'
    it('should ALLOW accessing animais:ler (via gerenciar permission)', () => {
      return request(app.getHttpServer())
        .get('/test-rbac/ler-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should ALLOW accessing animais:criar (via gerenciar permission)', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/criar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });

    it('should ALLOW accessing animais:gerenciar', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/gerenciar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });
  });

  describe('Role: DONO', () => {
    let token: string;

    beforeAll(() => {
      token = generateTokenForRole(FazendaRole.DONO);
    });

    it('should ALLOW accessing animais:ler', () => {
      return request(app.getHttpServer())
        .get('/test-rbac/ler-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should ALLOW accessing animais:criar', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/criar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });

    it('should ALLOW accessing animais:gerenciar', () => {
      return request(app.getHttpServer())
        .post('/test-rbac/gerenciar-animais')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });
  });
});
