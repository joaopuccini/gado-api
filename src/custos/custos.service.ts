import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';

@Injectable()
export class CustosService extends BaseTenantService<CreateCustoDto, any> {
    protected readonly logger = new Logger(CustosService.name);
    protected readonly modelName = 'Custo';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.custo; }

    // Sobrescreve create para lidar com a transação nas duas tabelas
    override async create(dto: CreateCustoDto) {
        return this.withTenant(async () => {
            // 1. Criar o registro de Custo principal
            const custo = await this.prisma.custo.create({
                data: {
                    id_animais: dto.id_animais,
                    id_custo_tipos: dto.id_custo_tipos,
                    qtd_animais: dto.id_animais.length,
                    descricao: dto.descricao,
                    valor_custo: dto.valor_custo,
                    data_custo: dto.data_custo ? new Date(dto.data_custo) : new Date(),
                },
            });

            // 2. Criar os registros individuais por animal (custo_animais)
            const valorPorCabeca = dto.valor_custo / dto.id_animais.length;
            const custoAnimaisData = dto.id_animais.map(animalId => ({
                id_custo: custo.id,
                id_animal: animalId,
                valor_cabeca: valorPorCabeca,
            }));

            await this.prisma.custoAnimal.createMany({
                data: custoAnimaisData,
            });

            return custo;
        });
    }
}

@Injectable()
export class CustoTiposService extends BaseTenantService<CreateCustoTipoDto, any> {
    protected readonly logger = new Logger(CustoTiposService.name);
    protected readonly modelName = 'Custo Tipo';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.custoTipo; }
}
