import { CaixaService } from './caixa.service';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';
import { PaginationDto } from '../common/dto';
export declare class CaixaController {
    private readonly service;
    constructor(service: CaixaService);
    create(dto: CreateCaixaDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateCaixaDto): Promise<any>;
    remove(id: number): Promise<any>;
}
