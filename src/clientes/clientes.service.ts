import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService extends BaseTenantService<CreateClienteDto, UpdateClienteDto> {
    protected readonly logger = new Logger(ClientesService.name);
    protected readonly modelName = 'Cliente';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.cliente; }
}
