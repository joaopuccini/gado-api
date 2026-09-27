import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  WEIGHT_REPOSITORY,
  type WeightRepository,
} from './application/ports/weight.repository';
import { ManageWeightsUseCase } from './application/use-cases/manage-weights.use-case';
import { PrismaWeightRepository } from './infrastructure/prisma-weight.repository';
import { WeightController } from './presentation/weight.controller';

@Module({
  imports: [TenantModule],
  controllers: [WeightController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaWeightRepository,
    { provide: WEIGHT_REPOSITORY, useExisting: PrismaWeightRepository },
    {
      provide: ManageWeightsUseCase,
      useFactory: (
        repository: WeightRepository,
        context: ExecutionContextStore,
      ) => new ManageWeightsUseCase(repository, context),
      inject: [WEIGHT_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class WeightsModule {}
