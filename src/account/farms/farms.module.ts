import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../../auth/auth.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  FARM_REPOSITORY,
  type FarmRepository,
} from './application/ports/farm.repository';
import {
  FARM_ACCESS_REPOSITORY,
  FARM_SESSION_ISSUER,
  type FarmAccessRepository,
  type FarmSessionIssuer,
} from './application/ports/farm-session.ports';
import { CreateFarmUseCase } from './application/use-cases/create-farm.use-case';
import { DeactivateFarmUseCase } from './application/use-cases/deactivate-farm.use-case';
import { ListFarmsUseCase } from './application/use-cases/list-farms.use-case';
import { SelectFarmUseCase } from './application/use-cases/select-farm.use-case';
import { UpdateFarmUseCase } from './application/use-cases/update-farm.use-case';
import { FarmHierarchyPolicy } from './domain/farm-hierarchy.policy';
import { JwtFarmSessionIssuer } from './infrastructure/jwt-farm-session.issuer';
import { PrismaFarmRepository } from './infrastructure/prisma-farm.repository';
import { FarmsController } from './presentation/farms.controller';

@Module({
  imports: [AuthModule, TenantModule],
  controllers: [FarmsController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    FarmHierarchyPolicy,
    PrismaFarmRepository,
    { provide: FARM_REPOSITORY, useExisting: PrismaFarmRepository },
    { provide: FARM_ACCESS_REPOSITORY, useExisting: PrismaFarmRepository },
    {
      provide: FARM_SESSION_ISSUER,
      useFactory: (jwt: JwtService): FarmSessionIssuer =>
        new JwtFarmSessionIssuer(jwt),
      inject: [JwtService],
    },
    {
      provide: CreateFarmUseCase,
      useFactory: (
        farms: FarmRepository,
        hierarchy: FarmHierarchyPolicy,
        context: ExecutionContextStore,
      ) => new CreateFarmUseCase(farms, hierarchy, context),
      inject: [FARM_REPOSITORY, FarmHierarchyPolicy, ExecutionContextStore],
    },
    {
      provide: ListFarmsUseCase,
      useFactory: (farms: FarmRepository, context: ExecutionContextStore) =>
        new ListFarmsUseCase(farms, context),
      inject: [FARM_REPOSITORY, ExecutionContextStore],
    },
    {
      provide: UpdateFarmUseCase,
      useFactory: (
        farms: FarmRepository,
        hierarchy: FarmHierarchyPolicy,
        context: ExecutionContextStore,
      ) => new UpdateFarmUseCase(farms, hierarchy, context),
      inject: [FARM_REPOSITORY, FarmHierarchyPolicy, ExecutionContextStore],
    },
    {
      provide: SelectFarmUseCase,
      useFactory: (
        farms: FarmRepository,
        accesses: FarmAccessRepository,
        sessions: FarmSessionIssuer,
        context: ExecutionContextStore,
      ) => new SelectFarmUseCase(farms, accesses, sessions, context),
      inject: [
        FARM_REPOSITORY,
        FARM_ACCESS_REPOSITORY,
        FARM_SESSION_ISSUER,
        ExecutionContextStore,
      ],
    },
    {
      provide: DeactivateFarmUseCase,
      useFactory: (farms: FarmRepository, context: ExecutionContextStore) =>
        new DeactivateFarmUseCase(farms, context),
      inject: [FARM_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class FarmsModule {}
