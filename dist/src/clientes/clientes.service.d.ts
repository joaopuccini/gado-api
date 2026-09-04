import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
export declare class ClientesService extends BaseTenantService<CreateClienteDto, UpdateClienteDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Cliente";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
