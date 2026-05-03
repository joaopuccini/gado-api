import { CustosService, CustoTiposService } from './custos.service';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';
import { PaginationDto } from '../common/dto';
export declare class CustosController {
    private readonly custoService;
    constructor(custoService: CustosService);
    createCusto(dto: CreateCustoDto): Promise<{
        message: string;
        response: {
            id: number;
            id_animais: number[];
            id_custo_tipos: number | null;
            qtd_animais: number;
            descricao: string | null;
            valor_custo: number | null;
            data_custo: Date;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
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
    removeCusto(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
export declare class CustosTipoController {
    private readonly tipoService;
    constructor(tipoService: CustoTiposService);
    createTipo(dto: CreateCustoTipoDto): Promise<{
        message: string;
        response: unknown;
    }>;
    findTipos(p: PaginationDto): Promise<{
        sucesso: boolean;
        data: {
            data: any;
            total: any;
        };
    }>;
}
