"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssinaturasService = void 0;
const common_1 = require("@nestjs/common");
const admin_prisma_service_1 = require("../admin-prisma.service");
let AssinaturasService = class AssinaturasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAssinaturaDto) {
        const plano = await this.prisma.plano.findUnique({
            where: { id: createAssinaturaDto.planoId },
        });
        if (!plano)
            throw new common_1.NotFoundException('Plano não encontrado');
        const organizacao = await this.prisma.organizacao.findUnique({
            where: { id: createAssinaturaDto.organizacaoId },
        });
        if (!organizacao)
            throw new common_1.NotFoundException('Organização não encontrada');
        return await this.prisma.$transaction(async (tx) => {
            const dataInicio = new Date();
            const dataVencimento = new Date();
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
            const assinatura = await tx.assinatura.create({
                data: {
                    organizacaoId: organizacao.id,
                    planoId: plano.id,
                    diaVencimento: createAssinaturaDto.diaVencimento,
                    dataInicio,
                    dataVencimento,
                    status: 'ATIVA',
                },
            });
            const meses = createAssinaturaDto.mesesGerarPagamento || 1;
            for (let i = 0; i < meses; i++) {
                const d = new Date(dataInicio);
                d.setMonth(d.getMonth() + i);
                const compAno = d.getFullYear();
                const compMes = String(d.getMonth() + 1).padStart(2, '0');
                await tx.pagamento.create({
                    data: {
                        assinaturaId: assinatura.id,
                        valor: plano.precoMensal,
                        competencia: `${compAno}-${compMes}`,
                        status: 'PENDENTE',
                    },
                });
            }
            return assinatura;
        });
    }
    async findAll() {
        return await this.prisma.assinatura.findMany({
            include: {
                organizacao: true,
                plano: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const assinatura = await this.prisma.assinatura.findUnique({
            where: { id },
            include: { organizacao: true, plano: true, pagamentos: true },
        });
        if (!assinatura)
            throw new common_1.NotFoundException(`Assinatura #${id} não encontrada`);
        return assinatura;
    }
    async update(id, updateAssinaturaDto) {
        try {
            return await this.prisma.assinatura.update({
                where: { id },
                data: updateAssinaturaDto,
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Assinatura #${id} não encontrada`);
        }
    }
    async remove(id) {
        try {
            return await this.prisma.assinatura.update({
                where: { id },
                data: { status: 'CANCELADA' },
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Assinatura #${id} não encontrada`);
        }
    }
    async registrarPagamento(pagamentoId, valorPago) {
        const pagamento = await this.prisma.pagamento.findUnique({
            where: { id: pagamentoId },
            include: { assinatura: true }
        });
        if (!pagamento)
            throw new common_1.NotFoundException('Pagamento não encontrado');
        if (pagamento.status === 'PAGO')
            throw new common_1.ConflictException('Este pagamento já foi baixado');
        return await this.prisma.$transaction(async (tx) => {
            const pag = await tx.pagamento.update({
                where: { id: pagamentoId },
                data: {
                    status: 'PAGO',
                    dataPagamento: new Date(),
                    observacao: `Valor pago: ${valorPago}`,
                }
            });
            const novaDataVenc = new Date(pagamento.assinatura.dataVencimento);
            novaDataVenc.setMonth(novaDataVenc.getMonth() + 1);
            await tx.assinatura.update({
                where: { id: pagamento.assinaturaId },
                data: {
                    dataVencimento: novaDataVenc,
                    status: 'ATIVA',
                }
            });
            await tx.organizacao.update({
                where: { id: pagamento.assinatura.organizacaoId },
                data: { status: 'ATIVO' }
            });
            return pag;
        });
    }
};
exports.AssinaturasService = AssinaturasService;
exports.AssinaturasService = AssinaturasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService])
], AssinaturasService);
//# sourceMappingURL=assinaturas.service.js.map