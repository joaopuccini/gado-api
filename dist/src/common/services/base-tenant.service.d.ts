import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';
export declare abstract class BaseTenantService<CreateDto, UpdateDto> {
    protected readonly tenantPrisma: TenantPrismaService;
    protected abstract readonly logger: Logger;
    protected abstract readonly modelName: string;
    constructor(tenantPrisma: TenantPrismaService);
    protected getTenantClient(): import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
    protected abstract getDelegate(tenant: any): any;
    create(dto: CreateDto): Promise<any>;
    findAll(options?: {
        skip?: number;
        take?: number;
        where?: any;
        include?: any;
    }): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number, include?: any): Promise<any>;
    update(id: number, dto: UpdateDto): Promise<any>;
    remove(id: number): Promise<any>;
}
