import { VacinacaoService } from './vacinacao.service';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';
import { PaginationDto } from '../common/dto';
export declare class VacinacaoController {
    private readonly service;
    constructor(service: VacinacaoService);
    create(dto: CreateVacinacaoDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateVacinacaoDto): Promise<any>;
    remove(id: number): Promise<any>;
}
