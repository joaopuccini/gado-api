import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';
export declare class VacinacaoService extends BaseTenantService<CreateVacinacaoDto, UpdateVacinacaoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Vacina\u00E7\u00E3o";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
