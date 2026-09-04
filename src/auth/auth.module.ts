import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { SocialProvisioningService } from './services/social-provisioning.service';
import { AdminModule } from '../admin/admin.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN', '1h') as any,
                },
            }),
        }),
        forwardRef(() => AdminModule),
        forwardRef(() => TenantModule),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        SocialProvisioningService,
        JwtStrategy,
        // Google OAuth é opcional — só registra quando as credenciais estão configuradas
        ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    ],
    exports: [JwtModule, PassportModule],
})
export class AuthModule { }
