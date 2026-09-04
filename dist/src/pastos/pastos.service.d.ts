import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';
export declare class PastosService extends BaseTenantService<CreatePastoDto, UpdatePastoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Pasto";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
