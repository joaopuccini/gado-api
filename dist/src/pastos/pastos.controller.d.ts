import { PastosService } from './pastos.service';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';
import { PaginationDto } from '../common/dto';
export declare class PastosController {
    private readonly service;
    constructor(service: PastosService);
    create(dto: CreatePastoDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdatePastoDto): Promise<any>;
    remove(id: number): Promise<any>;
}
