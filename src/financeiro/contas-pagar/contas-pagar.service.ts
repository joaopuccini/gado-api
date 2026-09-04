import { Injectable, Scope, Logger } from '@nestjs/common';
import { BaseTenantService } from '../../common/services/base-tenant.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class ContasPagarService extends BaseTenantService<any, any> {
  protected readonly logger = new Logger(ContasPagarService.name);
  protected readonly modelName = 'contaPagar';

  constructor(protected readonly tenantPrisma: TenantPrismaService) {
    super(tenantPrisma);
  }

  protected getDelegate(tenant: any) {
    return tenant.contaPagar;
  }
}
