import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { ApiAccountResponse } from '../../presentation/account-api-response.decorator';
import { GetSubscriptionSummaryUseCase } from '../application/use-cases/get-subscription-summary.use-case';
import { SubscriptionSummaryResponseDto } from './subscription.response';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('account/subscription')
export class SubscriptionController {
  constructor(
    private readonly getSubscription: GetSubscriptionSummaryUseCase,
  ) {}

  @Get()
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({
    operationId: 'getAccountSubscription',
    summary: 'Consultar assinatura e limites da conta',
  })
  @ApiAccountResponse({ type: SubscriptionSummaryResponseDto })
  get() {
    return this.getSubscription.execute();
  }
}
