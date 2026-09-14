import { forwardRef, Global, Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { TENANT_REGISTRY_REPOSITORY } from '../identity-access/application/ports/tenant-registry.repository';
import { ResolveTenantContextUseCase } from '../identity-access/application/use-cases/resolve-tenant-context.use-case';
import { PrismaTenantRegistryRepository } from '../identity-access/infrastructure/prisma-tenant-registry.repository';
import { TenantPrismaService } from './tenant-prisma.service';
import { TenantPrismaClientFactory } from './infrastructure/tenant-prisma-client.factory';
import { TENANT_PRISMA_CLIENT_FACTORY } from './application/ports/tenant-prisma-client.factory.port';
import { ExecutionContextStore } from '../common/context';

@Global()
@Module({
  imports: [forwardRef(() => AdminModule)],
  providers: [
    TenantPrismaClientFactory,
    {
      provide: TENANT_PRISMA_CLIENT_FACTORY,
      useExisting: TenantPrismaClientFactory,
    },
    TenantPrismaService,
    PrismaTenantRegistryRepository,
    {
      provide: TENANT_REGISTRY_REPOSITORY,
      useExisting: PrismaTenantRegistryRepository,
    },
    {
      provide: ResolveTenantContextUseCase,
      useFactory: (
        registry: PrismaTenantRegistryRepository,
        contextStore: ExecutionContextStore,
      ) => {
        return new ResolveTenantContextUseCase(registry, contextStore);
      },
      inject: [TENANT_REGISTRY_REPOSITORY, ExecutionContextStore],
    },
  ],
  exports: [
    TENANT_PRISMA_CLIENT_FACTORY,
    TenantPrismaService,
    ResolveTenantContextUseCase,
  ],
})
export class TenantModule {}
