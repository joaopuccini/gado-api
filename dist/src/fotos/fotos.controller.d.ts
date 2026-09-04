import { FotosService } from './fotos.service';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';
import { PaginationDto } from '../common/dto';
export declare class FotosController {
    private readonly service;
    constructor(service: FotosService);
    create(dto: CreateFotoDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateFotoDto): Promise<any>;
    remove(id: number): Promise<any>;
}
