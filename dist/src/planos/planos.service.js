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
exports.PlanosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlanosService = class PlanosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.plano.findMany({
            where: { excluido: false }
        });
    }
    async findOne(id) {
        const plano = await this.prisma.plano.findUnique({
            where: { id }
        });
        if (!plano || plano.excluido)
            throw new common_1.NotFoundException('Plano não encontrado');
        return plano;
    }
    async create(data) {
        return this.prisma.plano.create({
            data
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.plano.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.plano.update({
            where: { id },
            data: { excluido: true, excluido_data: new Date() }
        });
    }
};
exports.PlanosService = PlanosService;
exports.PlanosService = PlanosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanosService);
//# sourceMappingURL=planos.service.js.map