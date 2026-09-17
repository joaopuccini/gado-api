import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { GetPermissionsCatalogUseCase } from '../../identity-access/application/use-cases/get-permissions-catalog.use-case';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(
    private readonly getPermissionsCatalog: GetPermissionsCatalogUseCase,
  ) {}

  @Get('catalog')
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({ summary: 'Catálogo completo de permissões do sistema' })
  getCatalog() {
    return this.getPermissionsCatalog.execute();
  }
}
