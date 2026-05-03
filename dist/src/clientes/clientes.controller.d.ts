import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { PaginationDto } from '../common/dto';
export declare class ClientesController {
    private readonly service;
    constructor(service: ClientesService);
    create(dto: CreateClienteDto): Promise<{
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
    update(id: number, dto: UpdateClienteDto): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
