import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { GetPermissionsCatalogUseCase } from '../../identity-access/application/use-cases/get-permissions-catalog.use-case';
import { ApiErrorDto } from '../contracts/api-error.dto';
import { ApiSuccessDto } from '../contracts/api-success.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(
    private readonly getPermissionsCatalog: GetPermissionsCatalogUseCase,
  ) {}

  @Get('catalog')
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({ summary: 'Catálogo completo de permissões do sistema' })
  @ApiOkResponse({ type: ApiSuccessDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiInternalServerErrorResponse({ type: ApiErrorDto })
  getCatalog() {
    return this.getPermissionsCatalog.execute();
  }
}
