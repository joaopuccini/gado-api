import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';
export declare class CustosService extends BaseTenantService<CreateCustoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Custo";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
    create(dto: CreateCustoDto): Promise<{
        id: number;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        fazendaId: number;
        categoriaCustoId: number | null;
        registradoPorId: number | null;
        valorTotal: import("@prisma/client-runtime-utils").Decimal;
        dataCusto: Date;
        observacao: string | null;
    }>;
}
export declare class CustoTiposService extends BaseTenantService<CreateCustoTipoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "CategoriaCusto";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
