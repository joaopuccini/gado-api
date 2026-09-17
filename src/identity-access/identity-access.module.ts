import { forwardRef, Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { ExecutionContextStore } from '../common/context';
import { TenantModule } from '../tenant/tenant.module';
import {
  TENANT_REGISTRY_REPOSITORY,
  type TenantRegistryRepository,
} from './application/ports/tenant-registry.repository';
import { ResolveTenantContextUseCase } from './application/use-cases/resolve-tenant-context.use-case';
import { PrismaTenantRegistryRepository } from './infrastructure/prisma-tenant-registry.repository';
import { PermissionsController } from '../common/rbac/permissions.controller';

@Module({
  imports: [forwardRef(() => AdminModule), TenantModule],
  controllers: [PermissionsController],
  providers: [
    PrismaTenantRegistryRepository,
    {
      provide: TENANT_REGISTRY_REPOSITORY,
      useExisting: PrismaTenantRegistryRepository,
    },
    {
      provide: ResolveTenantContextUseCase,
      useFactory: (
        repository: TenantRegistryRepository,
        context: ExecutionContextStore,
      ): ResolveTenantContextUseCase =>
        new ResolveTenantContextUseCase(repository, context),
      inject: [TENANT_REGISTRY_REPOSITORY, ExecutionContextStore],
    },
  ],
  exports: [ResolveTenantContextUseCase],
})
export class IdentityAccessModule {}
