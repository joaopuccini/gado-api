import { ManejoService } from './manejo.service';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';
import { PaginationDto } from '../common/dto';
export declare class ManejoController {
    private readonly service;
    constructor(service: ManejoService);
    create(dto: CreateManejoDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateManejoDto): Promise<any>;
    remove(id: number): Promise<any>;
}
