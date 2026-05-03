import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateAnimalDto, UpdateAnimalDto } from './dto/animal.dto';
export declare class AnimaisService extends BaseTenantService<CreateAnimalDto, UpdateAnimalDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Animal";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.AnimalDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(options?: any): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number): Promise<any>;
}
