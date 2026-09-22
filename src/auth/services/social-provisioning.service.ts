import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import {
  TENANT_PRISMA_CLIENT_FACTORY,
  type TenantPrismaClientFactoryPort,
} from '../../tenant/application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from '../../tenant/domain/tenant-schema-name';
import { FazendaRole } from '../../common/rbac/rbac.config';
import { ExecutionContextStore } from '../../common/context';
import { StructuredLogger } from '../../common/logger/structured-logger.service';
import { MigrateTenantSchemaUseCase } from '../../tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { DomainError } from '../../common/errors/domain-error';

export interface ProvisionResult {
  organizacaoId: string;
  tenantId: string;
  schemaName: string;
  subdomain: string;
  usuarioLocalId: number;
  fazendaId: number;
  isNew: boolean;
}

@Injectable()
export class SocialProvisioningService {
  constructor(
    private readonly adminPrisma: AdminPrismaService,
    @Inject(TENANT_PRISMA_CLIENT_FACTORY)
    private readonly tenantClientFactory: TenantPrismaClientFactoryPort,
    private readonly configService: ConfigService,
    private readonly context: ExecutionContextStore,
    private readonly migrateTenantSchema: MigrateTenantSchemaUseCase,
    private readonly logger: StructuredLogger,
  ) {}

  /**
   * Provisiona organização TRIAL completa para novo usuário social.
   * Cria: Org → TenantRegistry → Schema → Plano Trial → Assinatura → UsuarioLocal → Fazenda
   */
  async provisionTrial(profile: {
    email: string;
    nome: string;
    globalUserId: string;
  }): Promise<ProvisionResult> {
    const slug = await this.generateUniqueSlug(profile.email);
    const schemaName = `tenant_${randomBytes(16).toString('hex')}`;
    const subdomain = slug;

    // 1. Criar Organização
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

    // 2. Criar TenantRegistry
    const tenant = await this.adminPrisma.tenantRegistry.create({
      data: {
        organizacaoId: org.id,
        subdomain,
        schemaName,
        status: 'PROVISIONANDO',
      },
    });

    // 3. Vincular UsuarioGlobal à Organização (PROPRIETARIO)
    await this.adminPrisma.acessoOrganizacao.create({
      data: {
        usuarioGlobalId: profile.globalUserId,
        organizacaoId: org.id,
        role: 'PROPRIETARIO',
        status: 'ATIVO',
      },
    });

    // 4. Criar Plano Trial e Assinatura
    const trialDays = this.configService.get<number>('TRIAL_DAYS', 30);
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

    // 5. Criar e atualizar o schema exclusivamente por migrations versionadas.
    const tenantSchema = TenantSchemaName.parse(schemaName);
    const migrationRequestId = randomUUID();
    await this.context.run(
      {
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
      },
      () => this.migrateTenantSchema.execute(),
    );

    // 6. Criar dados iniciais no tenant (UsuarioLocal + Fazenda + Perfil)
    const tenantClient = this.tenantClientFactory.create(tenantSchema);
    const adminPerfil = await tenantClient.perfil.findUnique({
      where: { systemRole: FazendaRole.DONO },
    });
    if (!adminPerfil) {
      throw new DomainError(
        'tenantMigrationFailed',
        'Seed de autorização do tenant ausente',
      );
    }

    const { usuarioLocal, fazenda } = await tenantClient.$transaction(
      async (transaction) => {
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
            role: FazendaRole.DONO,
          },
        });
        await this.seedDefaultFarmData(transaction, createdFarm.id);
        return { usuarioLocal: createdUser, fazenda: createdFarm };
      },
    );

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

  private async generateUniqueSlug(email: string): Promise<string> {
    let base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30);

    if (!base) base = 'fazenda';

    let slug = base;
    let counter = 1;

    while (true) {
      const exists = await this.adminPrisma.organizacao.findFirst({
        where: { subdomain: slug },
      });
      if (!exists) return slug;
      slug = `${base}${counter}`;
      counter++;
    }
  }

  private async getOrCreateTrialPlan() {
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

  private async seedDefaultFarmData(
    tenantClient: Prisma.TransactionClient,
    fazendaId: number,
  ): Promise<void> {
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
}
