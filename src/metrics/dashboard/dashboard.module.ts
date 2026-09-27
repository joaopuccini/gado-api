import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { MarketPriceModule } from '../../integrations/market-price/market-price.module';
import { TenantModule } from '../../tenant/tenant.module';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from './application/ports/dashboard.repository';
import { GetFarmDashboardUseCase } from './application/use-cases/get-farm-dashboard.use-case';
import { PrismaDashboardRepository } from './infrastructure/prisma-dashboard.repository';
import { FarmDashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [TenantModule, MarketPriceModule],
  controllers: [FarmDashboardController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaDashboardRepository,
    { provide: DASHBOARD_REPOSITORY, useExisting: PrismaDashboardRepository },
    {
      provide: GetFarmDashboardUseCase,
      useFactory: (
        repository: DashboardRepository,
        context: ExecutionContextStore,
      ) => new GetFarmDashboardUseCase(repository, context),
      inject: [DASHBOARD_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class DashboardModule {}
