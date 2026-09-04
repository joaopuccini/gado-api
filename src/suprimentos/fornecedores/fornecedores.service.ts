import { Injectable, Scope, Logger } from '@nestjs/common';
import { BaseTenantService } from '../../common/services/base-tenant.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class FornecedoresService extends BaseTenantService<any, any> {
  protected readonly logger = new Logger(FornecedoresService.name);
  protected readonly modelName = 'fornecedor';

  constructor(protected readonly tenantPrisma: TenantPrismaService) {
    super(tenantPrisma);
  }

  protected getDelegate(tenant: any) {
    return tenant.fornecedor;
  }
}
