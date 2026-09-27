import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { ApiHerdResponse } from '../../../herd/catalog/presentation/herd-api-response.decorator';
import { GetMarketPriceUseCase } from '../../../integrations/market-price/application/use-cases/get-market-price.use-case';
import { GetFarmDashboardUseCase } from '../application/use-cases/get-farm-dashboard.use-case';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class FarmDashboardController {
  constructor(
    private readonly dashboard: GetFarmDashboardUseCase,
    private readonly marketPrice: GetMarketPriceUseCase,
  ) {}

  @Get('summary')
  @RequirePermissions('dashboard:ler')
  @ApiOperation({
    operationId: 'getFarmDashboard',
    summary: 'Consultar indicadores reais da fazenda',
  })
  @ApiHerdResponse({ type: DashboardResponseDto })
  async summary(): Promise<DashboardResponseDto> {
    const [dashboard, marketPrice] = await Promise.all([
      this.dashboard.execute(),
      this.marketPrice.execute(),
    ]);
    return { ...dashboard, marketPrice };
  }
}
