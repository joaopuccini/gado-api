import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';
export declare class FotosService extends BaseTenantService<CreateFotoDto, UpdateFotoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Foto";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
