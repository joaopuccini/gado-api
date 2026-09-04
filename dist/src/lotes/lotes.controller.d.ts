import { LotesService } from './lotes.service';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';
import { PaginationDto } from '../common/dto';
export declare class LotesController {
    private readonly service;
    constructor(service: LotesService);
    create(dto: CreateLoteDto): Promise<any>;
    findAll(pagination: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateLoteDto): Promise<any>;
    remove(id: number): Promise<any>;
}
