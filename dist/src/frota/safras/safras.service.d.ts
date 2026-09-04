import { Logger } from '@nestjs/common';
import { BaseTenantService } from '../../common/services/base-tenant.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';
export declare class SafrasService extends BaseTenantService<any, any> {
    protected readonly tenantPrisma: TenantPrismaService;
    protected readonly logger: Logger;
    protected readonly modelName = "safra";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
