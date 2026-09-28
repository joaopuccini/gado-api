import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  PASTURE_REPOSITORY,
  type PastureRepository,
} from './application/ports/pasture.repository';
import { ManagePasturesUseCase } from './application/use-cases/manage-pastures.use-case';
import { PrismaPastureRepository } from './infrastructure/prisma-pasture.repository';
import { PastureController } from './presentation/pasture.controller';

@Module({
  imports: [TenantModule],
  controllers: [PastureController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaPastureRepository,
    { provide: PASTURE_REPOSITORY, useExisting: PrismaPastureRepository },
    {
      provide: ManagePasturesUseCase,
      useFactory: (
        repository: PastureRepository,
        context: ExecutionContextStore,
      ) => new ManagePasturesUseCase(repository, context),
      inject: [PASTURE_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class PasturesModule {}
