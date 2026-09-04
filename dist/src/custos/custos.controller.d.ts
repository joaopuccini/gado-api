import { CustosService, CustoTiposService } from './custos.service';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';
import { PaginationDto } from '../common/dto';
export declare class CustosController {
    private readonly custoService;
    constructor(custoService: CustosService);
    createCusto(dto: CreateCustoDto): Promise<{
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
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    removeCusto(id: number): Promise<any>;
}
export declare class CustosTipoController {
    private readonly tipoService;
    constructor(tipoService: CustoTiposService);
    createTipo(dto: CreateCustoTipoDto): Promise<any>;
    findTipos(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
}
