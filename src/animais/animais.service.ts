import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateAnimalDto, UpdateAnimalDto } from './dto/animal.dto';

@Injectable()
export class AnimaisService extends BaseTenantService<CreateAnimalDto, UpdateAnimalDto> {
    protected readonly logger = new Logger(AnimaisService.name);
    protected readonly modelName = 'Animal';

    constructor(prisma: PrismaService) {
        super(prisma);
    }

    protected getDelegate() {
        return this.prisma.animal;
    }

    // Sobrescreve findAll para incluir relações por padrão (útil para o dashboard/listagem)
    override async findAll(options?: any) {
        return super.findAll({
            ...options,
            include: {
                lote: true,
                raca: true,
                pasto: true,
                cliente: true,
            },
        });
    }

    // Sobrescreve findOne para detalhes completos
    override async findOne(id: number) {
        return super.findOne(id, {
            lote: true,
            raca: true,
            pasto: true,
            cliente: true,
            vacinacoes: true,
            fotos: true,
            kilos: { orderBy: { data_pesagem: 'desc' }, take: 5 },
        });
    }
}
