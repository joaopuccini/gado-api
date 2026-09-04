import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { PaginationDto } from '../common/dto';
export declare class ClientesController {
    private readonly service;
    constructor(service: ClientesService);
    create(dto: CreateClienteDto): Promise<any>;
    findAll(p: PaginationDto): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateClienteDto): Promise<any>;
    remove(id: number): Promise<any>;
}
