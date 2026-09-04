import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';
export declare class ManejoService extends BaseTenantService<CreateManejoDto, UpdateManejoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Manejo";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
