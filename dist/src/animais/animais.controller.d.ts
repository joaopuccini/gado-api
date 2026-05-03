import { AnimaisService } from './animais.service';
import { CreateAnimalDto, UpdateAnimalDto } from './dto/animal.dto';
import { PaginationDto } from '../common/dto';
export declare class AnimaisController {
    private readonly service;
    constructor(service: AnimaisService);
    create(dto: CreateAnimalDto): Promise<{
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
    update(id: number, dto: UpdateAnimalDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
