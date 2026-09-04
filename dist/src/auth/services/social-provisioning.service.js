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
var SocialProvisioningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialProvisioningService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin_prisma_service_1 = require("../../admin/admin-prisma.service");
const tenant_prisma_service_1 = require("../../tenant/tenant-prisma.service");
const rbac_config_1 = require("../../common/rbac/rbac.config");
let SocialProvisioningService = SocialProvisioningService_1 = class SocialProvisioningService {
    adminPrisma;
    tenantPrisma;
    configService;
    logger = new common_1.Logger(SocialProvisioningService_1.name);
    constructor(adminPrisma, tenantPrisma, configService) {
        this.adminPrisma = adminPrisma;
        this.tenantPrisma = tenantPrisma;
        this.configService = configService;
    }
    async provisionTrial(profile) {
        const slug = await this.generateUniqueSlug(profile.email);
        const schemaName = `fazenda_${slug}`;
        const subdomain = slug;
        this.logger.log(`Provisionando TRIAL para ${profile.email}: schema=${schemaName}`);
        const org = await this.adminPrisma.organizacao.create({
            data: {
                razaoSocial: profile.nome,
                nomeFantasia: profile.nome,
                email: profile.email,
                subdomain,
                schemaName,
                status: 'TRIAL',
            },
        });
        const tenant = await this.adminPrisma.tenantRegistry.create({
            data: {
                organizacaoId: org.id,
                subdomain,
                schemaName,
                status: 'ATIVO',
                provisionedAt: new Date(),
            },
        });
        await this.adminPrisma.acessoOrganizacao.create({
            data: {
                usuarioGlobalId: profile.globalUserId,
                organizacaoId: org.id,
                role: 'PROPRIETARIO',
                status: 'ATIVO',
            },
        });
        const trialDays = this.configService.get('TRIAL_DAYS', 30);
        const planoTrial = await this.getOrCreateTrialPlan();
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + trialDays);
        await this.adminPrisma.assinatura.create({
            data: {
                organizacaoId: org.id,
                planoId: planoTrial.id,
                status: 'ATIVA',
                dataInicio: new Date(),
                dataVencimento,
                diaVencimento: new Date().getDate(),
            },
        });
        await this.createTenantSchema(schemaName);
        const tenantClient = this.tenantPrisma.getClientForSchema(schemaName);
        await this.seedDefaultPermissions(tenantClient);
        const adminPerfil = await this.seedDefaultProfiles(tenantClient);
        const usuarioLocal = await tenantClient.usuario.create({
            data: {
                globalUserId: profile.globalUserId,
                nome: profile.nome,
                email: profile.email,
                senhaHash: '',
                perfilId: adminPerfil.id,
            },
        });
        const fazenda = await tenantClient.fazenda.create({
            data: {
                nome: 'Fazenda Principal',
                nomeProprietario: profile.nome,
            },
        });
        await tenantClient.usuarioFazenda.create({
            data: {
                usuarioId: usuarioLocal.id,
                fazendaId: fazenda.id,
                role: rbac_config_1.FazendaRole.DONO,
            },
        });
        await this.seedDefaultFarmData(tenantClient, fazenda.id);
        this.logger.log(`✅ TRIAL provisionado: org=${org.id}, schema=${schemaName}`);
        return {
            organizacaoId: org.id,
            tenantId: tenant.id,
            schemaName,
            subdomain,
            usuarioLocalId: usuarioLocal.id,
            fazendaId: fazenda.id,
            isNew: true,
        };
    }
    async generateUniqueSlug(email) {
        let base = email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 30);
        if (!base)
            base = 'fazenda';
        let slug = base;
        let counter = 1;
        while (true) {
            const exists = await this.adminPrisma.organizacao.findFirst({
                where: { subdomain: slug },
            });
            if (!exists)
                return slug;
            slug = `${base}${counter}`;
            counter++;
        }
    }
    async getOrCreateTrialPlan() {
        let plan = await this.adminPrisma.plano.findFirst({
            where: { nome: 'Trial' },
        });
        if (!plan) {
            plan = await this.adminPrisma.plano.create({
                data: {
                    nome: 'Trial',
                    maxUsuarios: 2,
                    maxFazendas: 1,
                    precoMensal: 0,
                },
            });
        }
        return plan;
    }
    async createTenantSchema(schemaName) {
        await this.adminPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        const templateSchema = 'public';
        const tables = await this.adminPrisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = $1`, templateSchema);
        for (const { tablename } of tables) {
            await this.adminPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."${tablename}" (LIKE "${templateSchema}"."${tablename}" INCLUDING ALL)`);
        }
        this.logger.log(`Schema ${schemaName} criado com ${tables.length} tabelas`);
    }
    async seedDefaultPermissions(tenantClient) {
        const permissoes = [
            { codigo: 'animais:ler', nome: 'Ler Animais', modulo: 'Animais' },
            { codigo: 'animais:criar', nome: 'Criar Animais', modulo: 'Animais' },
            { codigo: 'animais:editar', nome: 'Editar Animais', modulo: 'Animais' },
            { codigo: 'animais:excluir', nome: 'Excluir Animais', modulo: 'Animais' },
            { codigo: 'financeiro:ler', nome: 'Ver Financeiro', modulo: 'Financeiro' },
            { codigo: 'financeiro:criar', nome: 'Lançar Financeiro', modulo: 'Financeiro' },
            { codigo: 'financeiro:editar', nome: 'Editar Financeiro', modulo: 'Financeiro' },
            { codigo: 'financeiro:excluir', nome: 'Excluir Financeiro', modulo: 'Financeiro' },
            { codigo: 'configuracoes:gerenciar', nome: 'Gerenciar Configurações', modulo: 'Configurações' },
            { codigo: 'sanidade:ler', nome: 'Ver Sanidade', modulo: 'Sanidade' },
            { codigo: 'sanidade:criar', nome: 'Registrar Sanidade', modulo: 'Sanidade' },
            { codigo: 'sanidade:gerenciar', nome: 'Gerenciar Sanidade', modulo: 'Sanidade' },
            { codigo: 'manejo:ler', nome: 'Ver Manejo', modulo: 'Manejo' },
            { codigo: 'manejo:criar', nome: 'Registrar Manejo', modulo: 'Manejo' },
            { codigo: 'manejo:gerenciar', nome: 'Gerenciar Manejo', modulo: 'Manejo' },
            { codigo: 'pesagens:ler', nome: 'Ver Pesagens', modulo: 'Pesagens' },
            { codigo: 'pesagens:criar', nome: 'Registrar Pesagens', modulo: 'Pesagens' },
        ];
        for (const p of permissoes) {
            await tenantClient.permissao.upsert({
                where: { codigo: p.codigo },
                update: {},
                create: p,
            });
        }
    }
    async seedDefaultProfiles(tenantClient) {
        const adminPerfil = await tenantClient.perfil.upsert({
            where: { nome: 'Administrador' },
            update: {},
            create: {
                nome: 'Administrador',
                descricao: 'Acesso total ao sistema da fazenda',
            },
        });
        const allPerms = await tenantClient.permissao.findMany();
        for (const perm of allPerms) {
            await tenantClient.perfilPermissao.upsert({
                where: { perfilId_permissaoId: { perfilId: adminPerfil.id, permissaoId: perm.id } },
                update: {},
                create: { perfilId: adminPerfil.id, permissaoId: perm.id },
            });
        }
        return adminPerfil;
    }
    async seedDefaultFarmData(tenantClient, fazendaId) {
        await tenantClient.raca.upsert({
            where: { id: 1 },
            update: {},
            create: { descricao: 'Nelore' },
        });
        await tenantClient.lote.upsert({
            where: { id: 1 },
            update: {},
            create: { fazendaId, descricao: 'Lote Geral' },
        });
        await tenantClient.pasto.upsert({
            where: { id: 1 },
            update: {},
            create: { fazendaId, descricao: 'Pasto 1' },
        });
    }
};
exports.SocialProvisioningService = SocialProvisioningService;
exports.SocialProvisioningService = SocialProvisioningService = SocialProvisioningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService,
        tenant_prisma_service_1.TenantPrismaService,
        config_1.ConfigService])
], SocialProvisioningService);
//# sourceMappingURL=social-provisioning.service.js.map