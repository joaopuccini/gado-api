import { MovimentoPastoService, MovimentoLoteService } from './movimentacoes.service';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';
import { PaginationDto } from '../common/dto';
export declare class MovimentoPastoController {
    private readonly service;
    constructor(service: MovimentoPastoService);
    create(dto: CreateMovPastoDto): Promise<{
        message: string;
        response: unknown;
    }>;
    findAll(p: PaginationDto): Promise<{
        sucesso: boolean;
        data: {
            data: any;
            total: any;
        };
    }>;
}
export declare class MovimentoLoteController {
    private readonly service;
    constructor(service: MovimentoLoteService);
    create(dto: CreateMovLoteDto): Promise<{
        message: string;
        response: unknown;
    }>;
    findAll(p: PaginationDto): Promise<{
        sucesso: boolean;
        data: {
            data: any;
            total: any;
        };
    }>;
}
