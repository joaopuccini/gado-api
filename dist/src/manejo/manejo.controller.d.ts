import { ManejoService } from './manejo.service';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';
import { PaginationDto } from '../common/dto';
export declare class ManejoController {
    private readonly service;
    constructor(service: ManejoService);
    create(dto: CreateManejoDto): Promise<{
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
    update(id: number, dto: UpdateManejoDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
