import { VendasService } from './vendas.service';
import { CreateVendaDto } from './dto/venda.dto';
import { PaginationDto } from '../common/dto';
export declare class VendasController {
    private readonly service;
    constructor(service: VendasService);
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
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    remove(id: number): Promise<any>;
}
