import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  MOVEMENT_UNIT_OF_WORK,
  type MovementUnitOfWork,
} from './application/ports/movement.unit-of-work';
import { MoveAnimalUseCase } from './application/use-cases/move-animal.use-case';
import { PrismaMovementUnitOfWork } from './infrastructure/prisma-movement.unit-of-work';
import { MovementController } from './presentation/movement.controller';

@Module({
  imports: [TenantModule],
  controllers: [MovementController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaMovementUnitOfWork,
    {
      provide: MOVEMENT_UNIT_OF_WORK,
      useExisting: PrismaMovementUnitOfWork,
    },
    {
      provide: MoveAnimalUseCase,
      useFactory: (
        unitOfWork: MovementUnitOfWork,
        context: ExecutionContextStore,
      ) => new MoveAnimalUseCase(unitOfWork, context),
      inject: [MOVEMENT_UNIT_OF_WORK, ExecutionContextStore],
    },
  ],
})
export class MovementsModule {}
