import { Injectable, Scope, Logger } from '@nestjs/common';
import { BaseTenantService } from '../../common/services/base-tenant.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class AlmoxarifadosService extends BaseTenantService<any, any> {
  protected readonly logger = new Logger(AlmoxarifadosService.name);
  protected readonly modelName = 'almoxarifado';

  constructor(protected readonly tenantPrisma: TenantPrismaService) {
    super(tenantPrisma);
  }

  protected getDelegate(tenant: any) {
    return tenant.almoxarifado;
  }
}
