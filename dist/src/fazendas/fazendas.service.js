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
exports.FazendasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FazendasService = class FazendasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.fazenda.findMany({
            where: { excluido: false },
            include: {
                mensalidades: true
            }
        });
    }
    async findOne(id) {
        const fazenda = await this.prisma.fazenda.findUnique({
            where: { id },
            include: { mensalidades: true }
        });
        if (!fazenda || fazenda.excluido)
            throw new common_1.NotFoundException('Fazenda não encontrada');
        return fazenda;
    }
    async findByUserId(usuarioId) {
        return this.prisma.fazenda.findMany({
            where: {
                id_usuarios: { has: usuarioId },
                excluido: false
            }
        });
    }
    async create(data) {
        return this.prisma.fazenda.create({
            data: {
                ...data,
                status: data.status || 'PENDENTE',
            }
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.fazenda.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.fazenda.update({
            where: { id },
            data: { excluido: true, excluido_data: new Date() }
        });
    }
};
exports.FazendasService = FazendasService;
exports.FazendasService = FazendasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FazendasService);
//# sourceMappingURL=fazendas.service.js.map