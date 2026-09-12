import { forwardRef, Global, Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { TENANT_REGISTRY_REPOSITORY } from '../identity-access/application/ports/tenant-registry.repository';
import { ResolveTenantContextUseCase } from '../identity-access/application/use-cases/resolve-tenant-context.use-case';
import { PrismaTenantRegistryRepository } from '../identity-access/infrastructure/prisma-tenant-registry.repository';
import { TenantPrismaService } from './tenant-prisma.service';

@Global()
@Module({
  imports: [forwardRef(() => AdminModule)],
  providers: [
    TenantPrismaService,
    PrismaTenantRegistryRepository,
    {
      provide: TENANT_REGISTRY_REPOSITORY,
      useExisting: PrismaTenantRegistryRepository,
    },
    ResolveTenantContextUseCase,
  ],
  exports: [TenantPrismaService, ResolveTenantContextUseCase],
})
export class TenantModule {}
