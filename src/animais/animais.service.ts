import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateAnimalDto, UpdateAnimalDto, TransferirAnimalDto } from './dto/animal.dto';
import { RequestContext } from '../common/context/request-context';

@Injectable()
export class AnimaisService extends BaseTenantService<CreateAnimalDto, UpdateAnimalDto> {
    protected readonly logger = new Logger(AnimaisService.name);
    protected readonly modelName = 'Animal';

    constructor(tenantPrisma: TenantPrismaService) {
        super(tenantPrisma);
    }

    protected getDelegate() {
        return this.getTenantClient().animal;
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
            pesagens: { orderBy: { dataPesagem: 'desc' }, take: 5 },
        });
    }

    async seed() {
        const prisma = this.getTenantClient();
        
        // Ensure Fazenda exists
        let fazenda = await prisma.fazenda.findFirst();
        if (!fazenda) {
            fazenda = await prisma.fazenda.create({ data: { nome: 'Fazenda Modelo', ativo: true } });
        }

        // Ensure Raca exists
        let raca = await prisma.raca.findFirst();
        if (!raca) {
            raca = await prisma.raca.create({ data: { descricao: 'Nelore' } });
        }

        // Ensure Lote exists
        let lote = await prisma.lote.findFirst();
        if (!lote) {
            lote = await prisma.lote.create({ data: { descricao: 'Lote Engorda', fazendaId: fazenda.id } });
        }

        // Ensure Pasto exists
        let pasto = await prisma.pasto.findFirst();
        if (!pasto) {
            pasto = await prisma.pasto.create({ data: { descricao: 'Pasto Central', fazendaId: fazenda.id } });
        }

        // Create 25 animals
        const animalsToCreate = [];
        for (let i = 1; i <= 25; i++) {
            const pesoBase = 300 + Math.random() * 200; // Between 300 and 500
            animalsToCreate.push({
                fazendaId: fazenda.id,
                racaId: raca.id,
                loteId: lote.id,
                pastoId: pasto.id,
                numeroBrinco: `B-${1000 + i}`,
                status: 'ATIVO',
                pesoAtual: pesoBase,
                valorCustoTotal: pesoBase * 10,
                sexo: i % 2 === 0 ? 'MACHO' : 'FEMEA',
                dataEntrada: new Date(),
            });
        }

        // We use createMany (if supported) or individual creations
        await prisma.animal.createMany({
            data: animalsToCreate as any,
        });

        // Add some weighings
        const createdAnimals = await prisma.animal.findMany({ take: 25 });
        const pesagensToCreate = [];
        for (const animal of createdAnimals) {
            // Add a past weighing
            pesagensToCreate.push({
                animalId: animal.id,
                peso: Number(animal.pesoAtual) - 20,
                dataPesagem: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            });
            // Add current weighing
            pesagensToCreate.push({
                animalId: animal.id,
                peso: Number(animal.pesoAtual),
                dataPesagem: new Date(),
            });
        }
        await prisma.pesagem.createMany({ data: pesagensToCreate as any });

        return { message: '25 animais gerados com sucesso' };
    }

    async transferir(id: number, dto: TransferirAnimalDto) {
        const tenant = this.getTenantClient();
        const currentFazendaId = RequestContext.getFazendaId();
        const accessibleFazendaIds = RequestContext.getAccessibleFazendaIds() || (currentFazendaId ? [currentFazendaId] : []);
        
        // Verifica se tem acesso à fazenda de destino
        if (!accessibleFazendaIds.includes(dto.fazendaDestinoId)) {
            throw new Error('Você não tem acesso à fazenda de destino.');
        }

        const animal = await this.findOne(id);
        
        if (!animal) {
            throw new Error('Animal não encontrado.');
        }

        // Criar registro de transferência e atualizar o animal na mesma transação
        return tenant.$transaction(async (tx: any) => {
            // Cria o histórico
            await tx.transferenciaAnimal.create({
                data: {
                    animalId: animal.id,
                    fazendaOrigemId: animal.fazendaId,
                    fazendaDestinoId: dto.fazendaDestinoId,
                    pastoDestinoId: dto.pastoDestinoId,
                    loteDestinoId: dto.loteDestinoId,
                    observacao: dto.observacao,
                },
            });

            // Atualiza o animal
            const updatedAnimal = await tx.animal.update({
                where: { id: animal.id },
                data: {
                    fazendaId: dto.fazendaDestinoId,
                    pastoId: dto.pastoDestinoId ?? animal.pastoId,
                    loteId: dto.loteDestinoId ?? animal.loteId,
                },
            });

            return updatedAnimal;
        });
    }
}

