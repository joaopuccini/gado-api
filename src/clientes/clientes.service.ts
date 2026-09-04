import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService extends BaseTenantService<CreateClienteDto, UpdateClienteDto> {
    protected readonly logger = new Logger(ClientesService.name);
    protected readonly modelName = 'Cliente';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.cliente; }
}

