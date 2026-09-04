import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantMiddleware } from './tenant.middleware';
import { TenantRegistryService } from './tenant-registry.service';
import { TenantPrismaService } from './tenant-prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    TenantRegistryService,
    TenantPrismaService,
  ],
  exports: [
    TenantRegistryService,
    TenantPrismaService,
  ],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware em todas as rotas EXCETO admin e health
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'admin/(.*)',       // Rotas do painel admin SaaS
        'health',           // Health check
        'api',              // Swagger UI
        'api/(.*)',         // Swagger assets
      )
      .forRoutes('*');
  }
}
