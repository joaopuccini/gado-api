import { RacasService } from './racas.service';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';
import { PaginationDto } from '../common/dto';
export declare class RacasController {
    private readonly service;
    constructor(service: RacasService);
    create(dto: CreateRacaDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateRacaDto): Promise<any>;
    remove(id: number): Promise<any>;
}
