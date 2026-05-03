import { VendasService } from './vendas.service';
import { CreateVendaDto } from './dto/venda.dto';
import { PaginationDto } from '../common/dto';
export declare class VendasController {
    private readonly service;
    constructor(service: VendasService);
    create(dto: CreateVendaDto): Promise<{
        message: string;
        response: {
            id_animais: number[];
            qtd_animais: number;
            valor_venda: number | null;
            valor_custo: number | null;
            data_venda: Date;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
            id: number;
            id_cliente: number;
        };
    }>;
    findAll(p: PaginationDto): Promise<{
        sucesso: boolean;
        data: {
            data: any;
            total: any;
        };
    }>;
    findOne(id: number): Promise<{
        sucesso: boolean;
        data: any;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
