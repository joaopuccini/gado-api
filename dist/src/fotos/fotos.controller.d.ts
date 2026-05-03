import { FotosService } from './fotos.service';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';
import { PaginationDto } from '../common/dto';
export declare class FotosController {
    private readonly service;
    constructor(service: FotosService);
    create(dto: CreateFotoDto): Promise<{
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
    update(id: number, dto: UpdateFotoDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
