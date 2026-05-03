import { CaixaService } from './caixa.service';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';
import { PaginationDto } from '../common/dto';
export declare class CaixaController {
    private readonly service;
    constructor(service: CaixaService);
    create(dto: CreateCaixaDto): Promise<{
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
    update(id: number, dto: UpdateCaixaDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
