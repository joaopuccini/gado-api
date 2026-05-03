import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';

@Injectable()
export class FotosService extends BaseTenantService<CreateFotoDto, UpdateFotoDto> {
    protected readonly logger = new Logger(FotosService.name);
    protected readonly modelName = 'Foto';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.foto; }
}
