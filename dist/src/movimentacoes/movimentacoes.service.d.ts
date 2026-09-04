import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';
export declare class MovimentoPastoService extends BaseTenantService<CreateMovPastoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Movimenta\u00E7\u00E3o Pasto";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
export declare class MovimentoLoteService extends BaseTenantService<CreateMovLoteDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Movimenta\u00E7\u00E3o Lote";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
