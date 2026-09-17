import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PERMISSIONS_CATALOG, PermissionEntry } from './permissions-catalog';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  @Get('catalog')
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({ summary: 'Catálogo completo de permissões do sistema' })
  getCatalog() {
    return { data: this.groupByModule(PERMISSIONS_CATALOG) };
  }

  private groupByModule(catalog: readonly PermissionEntry[]) {
    return catalog.reduce((acc, entry) => {
      if (!acc[entry.module]) {
        acc[entry.module] = [];
      }
      acc[entry.module].push(entry);
      return acc;
    }, {} as Record<string, PermissionEntry[]>);
  }
}
