import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVendaDto } from './dto/venda.dto';
export declare class VendasService extends BaseTenantService<CreateVendaDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Venda";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.VendaDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateVendaDto): Promise<{
        id: number;
        observacao: string | null;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        id_cliente: number;
        id_animais: number[];
        qtd_animais: number;
        valor_custo: number | null;
        valor_venda: number | null;
        data_venda: Date;
    }>;
}
