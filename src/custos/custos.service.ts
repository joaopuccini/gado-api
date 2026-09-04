import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';

@Injectable()
export class CustosService extends BaseTenantService<CreateCustoDto, any> {
    protected readonly logger = new Logger(CustosService.name);
    protected readonly modelName = 'Custo';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.custo; }

    // Sobrescreve create para lidar com a transação nas duas tabelas
    override async create(dto: CreateCustoDto) {
        const tenant = this.getTenantClient();
        
        // 1. Criar o registro de Custo principal
        const custo = await tenant.custo.create({
            data: {
                categoriaCustoId: dto.id_custo_tipos, // mapeando do frontend legado
                descricao: dto.descricao,
                valorTotal: dto.valor_custo,
                dataCusto: dto.data_custo ? new Date(dto.data_custo) : new Date(),
                ativo: true,
            } as any,
        });

        // 2. Criar os registros individuais por animal (custo_animais)
        if (dto.id_animais && dto.id_animais.length > 0) {
            const valorPorCabeca = dto.valor_custo / dto.id_animais.length;
            const custoAnimaisData = dto.id_animais.map(animalId => ({
                custoId: custo.id,
                animalId: animalId,
                valorCabeca: valorPorCabeca,
            }));

            await tenant.custoAnimal.createMany({
                data: custoAnimaisData as any,
            });
        }

        return custo;
    }
}

@Injectable()
export class CustoTiposService extends BaseTenantService<CreateCustoTipoDto, any> {
    protected readonly logger = new Logger(CustoTiposService.name);
    protected readonly modelName = 'CategoriaCusto';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.categoriaCusto; }
}
