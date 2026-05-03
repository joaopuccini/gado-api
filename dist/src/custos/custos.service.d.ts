import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';
export declare class CustosService extends BaseTenantService<CreateCustoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Custo";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.CustoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateCustoDto): Promise<{
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        descricao: string | null;
        id_animais: number[];
        id_custo_tipos: number | null;
        qtd_animais: number;
        valor_custo: number | null;
        data_custo: Date;
    }>;
}
export declare class CustoTiposService extends BaseTenantService<CreateCustoTipoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Custo Tipo";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.CustoTipoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
