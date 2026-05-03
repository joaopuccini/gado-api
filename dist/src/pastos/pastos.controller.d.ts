import { PastosService } from './pastos.service';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';
import { PaginationDto } from '../common/dto';
export declare class PastosController {
    private readonly service;
    constructor(service: PastosService);
    create(dto: CreatePastoDto): Promise<{
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
    findOne(id: number): Promise<{
        sucesso: boolean;
        data: any;
    }>;
    update(id: number, dto: UpdatePastoDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
