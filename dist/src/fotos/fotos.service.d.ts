import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';
export declare class FotosService extends BaseTenantService<CreateFotoDto, UpdateFotoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Foto";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.FotoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
