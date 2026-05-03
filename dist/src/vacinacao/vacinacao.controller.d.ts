import { VacinacaoService } from './vacinacao.service';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';
import { PaginationDto } from '../common/dto';
export declare class VacinacaoController {
    private readonly service;
    constructor(service: VacinacaoService);
    create(dto: CreateVacinacaoDto): Promise<{
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
    update(id: number, dto: UpdateVacinacaoDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
