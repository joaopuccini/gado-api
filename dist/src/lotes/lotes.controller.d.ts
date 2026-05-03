import { LotesService } from './lotes.service';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';
import { PaginationDto } from '../common/dto';
export declare class LotesController {
    private readonly service;
    constructor(service: LotesService);
    create(dto: CreateLoteDto): Promise<{
        message: string;
        response: unknown;
    }>;
    findAll(pagination: PaginationDto): Promise<{
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
    update(id: number, dto: UpdateLoteDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
