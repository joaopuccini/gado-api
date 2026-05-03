import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';
export declare class ManejoService extends BaseTenantService<CreateManejoDto, UpdateManejoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Manejo";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.ManejoReproducaoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
