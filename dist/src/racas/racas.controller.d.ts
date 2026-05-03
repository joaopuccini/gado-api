import { RacasService } from './racas.service';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';
import { PaginationDto } from '../common/dto';
export declare class RacasController {
    private readonly service;
    constructor(service: RacasService);
    create(dto: CreateRacaDto): Promise<{
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
    update(id: number, dto: UpdateRacaDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
