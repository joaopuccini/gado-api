import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { ApiAccountResponse } from '../../presentation/account-api-response.decorator';
import { GetOrganizationAccountUseCase } from '../application/use-cases/get-organization-account.use-case';
import { OrganizationAccountResponseDto } from './organization.response';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('account/organization')
export class OrganizationController {
  constructor(
    private readonly getOrganization: GetOrganizationAccountUseCase,
  ) {}

  @Get()
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({
    operationId: 'getAccountOrganization',
    summary: 'Consultar organização da conta',
  })
  @ApiAccountResponse({ type: OrganizationAccountResponseDto })
  get() {
    return this.getOrganization.execute();
  }
}
