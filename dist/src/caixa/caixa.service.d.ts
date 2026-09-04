import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';
export declare class CaixaService extends BaseTenantService<CreateCaixaDto, UpdateCaixaDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Caixa";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
