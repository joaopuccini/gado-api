import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';

@Injectable()
export class ManejoService extends BaseTenantService<CreateManejoDto, UpdateManejoDto> {
    protected readonly logger = new Logger(ManejoService.name);
    protected readonly modelName = 'Manejo';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.manejoReproducao; }
}
