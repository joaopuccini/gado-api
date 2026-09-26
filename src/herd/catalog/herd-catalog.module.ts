import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  HERD_CATALOG_REPOSITORY,
  type HerdCatalogRepository,
} from './application/ports/herd-catalog.repository';
import { ManageHerdCatalogUseCase } from './application/use-cases/manage-herd-catalog.use-case';
import { PrismaHerdCatalogRepository } from './infrastructure/prisma-herd-catalog.repository';
import {
  BatchesController,
  BreedsController,
} from './presentation/herd-catalog.controller';

@Module({
  imports: [TenantModule],
  controllers: [BreedsController, BatchesController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaHerdCatalogRepository,
    {
      provide: HERD_CATALOG_REPOSITORY,
      useExisting: PrismaHerdCatalogRepository,
    },
    {
      provide: ManageHerdCatalogUseCase,
      useFactory: (
        repository: HerdCatalogRepository,
        context: ExecutionContextStore,
      ) => new ManageHerdCatalogUseCase(repository, context),
      inject: [HERD_CATALOG_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class HerdCatalogModule {}
