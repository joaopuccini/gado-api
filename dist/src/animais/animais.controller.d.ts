import { AnimaisService } from './animais.service';
import { CreateAnimalDto, UpdateAnimalDto, TransferirAnimalDto } from './dto/animal.dto';
import { PaginationDto } from '../common/dto';
export declare class AnimaisController {
    private readonly service;
    constructor(service: AnimaisService);
    create(dto: CreateAnimalDto): Promise<any>;
    seed(): Promise<{
        message: string;
    }>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateAnimalDto): Promise<any>;
    transferir(id: number, dto: TransferirAnimalDto): Promise<any>;
    remove(id: number): Promise<any>;
}
