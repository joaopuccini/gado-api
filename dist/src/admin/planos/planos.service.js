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
const admin_prisma_service_1 = require("../admin-prisma.service");
let PlanosService = class PlanosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPlanoDto) {
        return await this.prisma.plano.create({
            data: createPlanoDto,
        });
    }
    async findAll() {
        return await this.prisma.plano.findMany({
            where: { ativo: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const plano = await this.prisma.plano.findUnique({
            where: { id },
        });
        if (!plano) {
            throw new common_1.NotFoundException(`Plano #${id} não encontrado`);
        }
        return plano;
    }
    async update(id, updatePlanoDto) {
        try {
            return await this.prisma.plano.update({
                where: { id },
                data: updatePlanoDto,
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Plano #${id} não encontrado`);
        }
    }
    async remove(id) {
        try {
            return await this.prisma.plano.update({
                where: { id },
                data: { ativo: false },
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Plano #${id} não encontrado`);
        }
    }
};
exports.PlanosService = PlanosService;
exports.PlanosService = PlanosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService])
], PlanosService);
//# sourceMappingURL=planos.service.js.map