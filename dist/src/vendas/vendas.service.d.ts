import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVendaDto } from './dto/venda.dto';
export declare class VendasService extends BaseTenantService<CreateVendaDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Venda";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
    create(dto: CreateVendaDto): Promise<{
        id: number;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        fazendaId: number;
        registradoPorId: number | null;
        valorTotal: import("@prisma/client-runtime-utils").Decimal | null;
        observacao: string | null;
        clienteId: number;
        custoTotal: import("@prisma/client-runtime-utils").Decimal | null;
        lucro: import("@prisma/client-runtime-utils").Decimal | null;
        dataVenda: Date;
    }>;
}
