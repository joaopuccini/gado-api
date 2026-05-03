import { KilosService } from './kilos.service';
import { CreateKiloDto, UpdateKiloDto } from './dto/kilo.dto';
import { PaginationDto } from '../common/dto';
export declare class KilosController {
    private readonly service;
    constructor(service: KilosService);
    create(dto: CreateKiloDto): Promise<{
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
    update(id: number, dto: UpdateKiloDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
