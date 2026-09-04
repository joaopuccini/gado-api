import { MovimentoPastoService, MovimentoLoteService } from './movimentacoes.service';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';
import { PaginationDto } from '../common/dto';
export declare class MovimentoPastoController {
    private readonly service;
    constructor(service: MovimentoPastoService);
    create(dto: CreateMovPastoDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
}
export declare class MovimentoLoteController {
    private readonly service;
    constructor(service: MovimentoLoteService);
    create(dto: CreateMovLoteDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
}
