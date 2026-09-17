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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialProvisioningService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const config_1 = require("@nestjs/config");
const admin_prisma_service_1 = require("../../admin/admin-prisma.service");
const tenant_prisma_client_factory_port_1 = require("../../tenant/application/ports/tenant-prisma-client-factory.port");
const tenant_schema_name_1 = require("../../tenant/domain/tenant-schema-name");
const rbac_config_1 = require("../../common/rbac/rbac.config");
const context_1 = require("../../common/context");
const structured_logger_service_1 = require("../../common/logger/structured-logger.service");
const migrate_tenant_schema_use_case_1 = require("../../tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case");
const domain_error_1 = require("../../common/errors/domain-error");
let SocialProvisioningService = class SocialProvisioningService {
    adminPrisma;
    tenantClientFactory;
    configService;
    context;
    migrateTenantSchema;
    logger;
    constructor(adminPrisma, tenantClientFactory, configService, context, migrateTenantSchema, logger) {
        this.adminPrisma = adminPrisma;
        this.tenantClientFactory = tenantClientFactory;
        this.configService = configService;
        this.context = context;
        this.migrateTenantSchema = migrateTenantSchema;
        this.logger = logger;
    }
    async provisionTrial(profile) {
        const slug = await this.generateUniqueSlug(profile.email);
        const schemaName = `tenant_${(0, node_crypto_1.randomBytes)(16).toString('hex')}`;
        const subdomain = slug;
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
                status: 'PROVISIONANDO',
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
        const tenantSchema = tenant_schema_name_1.TenantSchemaName.parse(schemaName);
        const migrationRequestId = (0, node_crypto_1.randomUUID)();
        await this.context.run({
            requestId: migrationRequestId,
            traceId: migrationRequestId,
            contextType: 'job',
            startedAt: Date.now(),
            tenantId: tenant.id,
            organizationId: org.id,
            schemaName,
            globalUserId: profile.globalUserId,
            accessibleFarmIds: [],
            permissions: ['tenant.migrate'],
        }, () => this.migrateTenantSchema.execute());
        const tenantClient = this.tenantClientFactory.create(tenantSchema);
        const adminPerfil = await tenantClient.perfil.findUnique({
            where: { nome: 'Administrador' },
        });
        if (!adminPerfil) {
            throw new domain_error_1.DomainError('tenantMigrationFailed', 'Seed de autorização do tenant ausente');
        }
        const { usuarioLocal, fazenda } = await tenantClient.$transaction(async (transaction) => {
            const createdUser = await transaction.usuario.create({
                data: {
                    globalUserId: profile.globalUserId,
                    nome: profile.nome,
                    email: profile.email,
                    senhaHash: '',
                    perfilId: adminPerfil.id,
                },
            });
            const createdFarm = await transaction.fazenda.create({
                data: {
                    nome: 'Fazenda Principal',
                    nomeProprietario: profile.nome,
                },
            });
            await transaction.usuarioFazenda.create({
                data: {
                    usuarioId: createdUser.id,
                    fazendaId: createdFarm.id,
                    role: rbac_config_1.FazendaRole.DONO,
                },
            });
            await this.seedDefaultFarmData(transaction, createdFarm.id);
            return { usuarioLocal: createdUser, fazenda: createdFarm };
        });
        await tenantClient.fazenda.findUniqueOrThrow({ where: { id: fazenda.id } });
        await this.adminPrisma.tenantRegistry.update({
            where: { id: tenant.id },
            data: { status: 'ATIVO', provisionedAt: new Date() },
        });
        this.logger.info('tenantTrialProvisioned', {
            module: 'tenantProvisioning',
            operation: 'provisionTrial',
            tenantId: tenant.id,
            organizationId: org.id,
            schemaName,
        });
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
        let base = email
            .split('@')[0]
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
exports.SocialProvisioningService = SocialProvisioningService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(tenant_prisma_client_factory_port_1.TENANT_PRISMA_CLIENT_FACTORY)),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService, Object, config_1.ConfigService,
        context_1.ExecutionContextStore,
        migrate_tenant_schema_use_case_1.MigrateTenantSchemaUseCase,
        structured_logger_service_1.StructuredLogger])
], SocialProvisioningService);
//# sourceMappingURL=social-provisioning.service.js.map