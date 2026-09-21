import { Module, forwardRef } from '@nestjs/common';
import { JwtModule, JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { SocialProvisioningService } from './services/social-provisioning.service';
import { AdminModule } from '../admin/admin.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantProvisioningModule } from '../tenant-provisioning/tenant-provisioning.module';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { ProvisioningCredentialService } from './services/provisioning-credential.service';
import { ProvisioningJwtStrategy } from './strategies/provisioning-jwt.strategy';
import {
  ADMIN_IDENTITY_REPOSITORY,
  ADMIN_PASSWORD_VERIFIER,
  ADMIN_TOKEN_ISSUER,
  type AdminIdentityRepository,
  type AdminPasswordVerifier,
  type AdminTokenIssuer,
} from './application/ports/admin-login.ports';
import { AdminLoginUseCase } from './application/use-cases/admin-login.use-case';
import { BcryptAdminPasswordVerifier } from './infrastructure/bcrypt-admin-password.verifier';
import { JwtAdminTokenIssuer } from './infrastructure/jwt-admin-token.issuer';
import { PrismaAdminIdentityRepository } from './infrastructure/prisma-admin-identity.repository';
import { AdminPrismaService } from '../admin/admin-prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<JwtSignOptions['expiresIn']>('JWT_EXPIRES_IN') ??
            '1h',
        },
      }),
    }),
    forwardRef(() => AdminModule),
    forwardRef(() => TenantModule),
    forwardRef(() => IdentityAccessModule),
    TenantProvisioningModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SocialProvisioningService,
    ProvisioningCredentialService,
    ProvisioningJwtStrategy,
    JwtStrategy,
    {
      provide: ADMIN_IDENTITY_REPOSITORY,
      useFactory: (database: AdminPrismaService): AdminIdentityRepository =>
        new PrismaAdminIdentityRepository(database),
      inject: [AdminPrismaService],
    },
    {
      provide: ADMIN_PASSWORD_VERIFIER,
      useFactory: (): AdminPasswordVerifier =>
        new BcryptAdminPasswordVerifier(),
    },
    {
      provide: ADMIN_TOKEN_ISSUER,
      useFactory: (jwt: JwtService): AdminTokenIssuer =>
        new JwtAdminTokenIssuer(jwt),
      inject: [JwtService],
    },
    {
      provide: AdminLoginUseCase,
      useFactory: (
        identities: AdminIdentityRepository,
        passwords: AdminPasswordVerifier,
        tokens: AdminTokenIssuer,
      ): AdminLoginUseCase =>
        new AdminLoginUseCase(identities, passwords, tokens),
      inject: [
        ADMIN_IDENTITY_REPOSITORY,
        ADMIN_PASSWORD_VERIFIER,
        ADMIN_TOKEN_ISSUER,
      ],
    },
    // Google OAuth é opcional — só registra quando as credenciais estão configuradas
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
  ],
  exports: [JwtModule, PassportModule, AdminLoginUseCase],
})
export class AuthModule {}
