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
exports.OrganizacoesService = void 0;
const common_1 = require("@nestjs/common");
const admin_prisma_service_1 = require("../admin-prisma.service");
const client_1 = require("@prisma/client");
let OrganizacoesService = class OrganizacoesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createOrganizacaoDto) {
        const existingOrg = await this.prisma.organizacao.findFirst({
            where: {
                OR: [
                    { subdomain: createOrganizacaoDto.subdomain },
                    ...(createOrganizacaoDto.cnpj ? [{ cnpj: createOrganizacaoDto.cnpj }] : []),
                ],
            },
        });
        if (existingOrg) {
            throw new common_1.ConflictException('Organização já existe com este subdomínio ou CNPJ');
        }
        const schemaName = `tenant_${createOrganizacaoDto.subdomain}`;
        return await this.prisma.$transaction(async (tx) => {
            const org = await tx.organizacao.create({
                data: {
                    razaoSocial: createOrganizacaoDto.razaoSocial,
                    nomeFantasia: createOrganizacaoDto.nomeFantasia,
                    cnpj: createOrganizacaoDto.cnpj,
                    email: createOrganizacaoDto.email,
                    telefone: createOrganizacaoDto.telefone,
                    subdomain: createOrganizacaoDto.subdomain,
                    schemaName: schemaName,
                    status: 'TRIAL',
                },
            });
            const registry = await tx.tenantRegistry.create({
                data: {
                    organizacaoId: org.id,
                    subdomain: createOrganizacaoDto.subdomain,
                    schemaName: schemaName,
                    status: 'PROVISIONANDO',
                },
            });
            try {
                const tenantDb = new client_1.PrismaClient();
                await tenantDb.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
                await tenantDb.$disconnect();
                await tx.tenantRegistry.update({
                    where: { id: registry.id },
                    data: { status: 'ATIVO', provisionedAt: new Date() }
                });
            }
            catch (e) {
                console.error('Erro ao provisionar schema', e);
            }
            return org;
        });
    }
    async findAll() {
        return await this.prisma.organizacao.findMany({
            include: { tenantRegistry: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const org = await this.prisma.organizacao.findUnique({
            where: { id },
            include: { tenantRegistry: true },
        });
        if (!org) {
            throw new common_1.NotFoundException(`Organização #${id} não encontrada`);
        }
        return org;
    }
    async update(id, updateOrganizacaoDto) {
        try {
            return await this.prisma.organizacao.update({
                where: { id },
                data: updateOrganizacaoDto,
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Organização #${id} não encontrada`);
        }
    }
    async remove(id) {
        try {
            return await this.prisma.organizacao.update({
                where: { id },
                data: { status: 'CANCELADO' },
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`Organização #${id} não encontrada`);
        }
    }
};
exports.OrganizacoesService = OrganizacoesService;
exports.OrganizacoesService = OrganizacoesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService])
], OrganizacoesService);
//# sourceMappingURL=organizacoes.service.js.map