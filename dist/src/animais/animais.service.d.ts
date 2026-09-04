import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateAnimalDto, UpdateAnimalDto, TransferirAnimalDto } from './dto/animal.dto';
export declare class AnimaisService extends BaseTenantService<CreateAnimalDto, UpdateAnimalDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Animal";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.AnimalDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(options?: any): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
    seed(): Promise<{
        message: string;
    }>;
    transferir(id: number, dto: TransferirAnimalDto): Promise<any>;
}
