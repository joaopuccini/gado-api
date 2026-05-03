import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
export declare class ClientesService extends BaseTenantService<CreateClienteDto, UpdateClienteDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Cliente";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.ClienteDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
