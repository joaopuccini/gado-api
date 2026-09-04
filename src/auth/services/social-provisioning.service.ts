import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';
import { FazendaRole } from '../../common/rbac/rbac.config';
import * as bcrypt from 'bcrypt';

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
  private readonly logger = new Logger(SocialProvisioningService.name);

  constructor(
    private readonly adminPrisma: AdminPrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly configService: ConfigService,
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
    const schemaName = `fazenda_${slug}`;
    const subdomain = slug;

    this.logger.log(`Provisionando TRIAL para ${profile.email}: schema=${schemaName}`);

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
        status: 'ATIVO',
        provisionedAt: new Date(),
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

    // 5. Criar Schema no PostgreSQL
    await this.createTenantSchema(schemaName);

    // 6. Criar dados iniciais no tenant (UsuarioLocal + Fazenda + Perfil)
    const tenantClient = this.tenantPrisma.getClientForSchema(schemaName);

    // Seed permissões e perfis padrão
    await this.seedDefaultPermissions(tenantClient);
    const adminPerfil = await this.seedDefaultProfiles(tenantClient);

    // Criar UsuarioLocal
    const usuarioLocal = await tenantClient.usuario.create({
      data: {
        globalUserId: profile.globalUserId,
        nome: profile.nome,
        email: profile.email,
        senhaHash: '', // OAuth user, sem senha
        perfilId: adminPerfil.id,
      },
    });

    // Criar Fazenda padrão
    const fazenda = await tenantClient.fazenda.create({
      data: {
        nome: 'Fazenda Principal',
        nomeProprietario: profile.nome,
      },
    });

    // Vincular UsuarioFazenda como DONO
    await tenantClient.usuarioFazenda.create({
      data: {
        usuarioId: usuarioLocal.id,
        fazendaId: fazenda.id,
        role: FazendaRole.DONO,
      },
    });

    // Criar dados base (Raça, Lote, Pasto padrão)
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

  private async generateUniqueSlug(email: string): Promise<string> {
    let base = email.split('@')[0]
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

  private async createTenantSchema(schemaName: string): Promise<void> {
    // Usar $executeRawUnsafe via AdminPrisma para criar o schema
    await this.adminPrisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    // Copiar tabelas do schema template
    // Em produção usaria prisma migrate deploy; aqui cria via DDL
    const templateSchema = 'public'; // mudado de gado_fazendas para public se for esse o default

    // Buscar todas as tabelas do schema template e recriar no novo schema
    const tables = await this.adminPrisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
      templateSchema,
    );

    for (const { tablename } of tables) {
      await this.adminPrisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${schemaName}"."${tablename}" (LIKE "${templateSchema}"."${tablename}" INCLUDING ALL)`,
      );
    }

    this.logger.log(`Schema ${schemaName} criado com ${tables.length} tabelas`);
  }

  private async seedDefaultPermissions(tenantClient: any): Promise<void> {
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

  private async seedDefaultProfiles(tenantClient: any) {
    const adminPerfil = await tenantClient.perfil.upsert({
      where: { nome: 'Administrador' },
      update: {},
      create: {
        nome: 'Administrador',
        descricao: 'Acesso total ao sistema da fazenda',
      },
    });

    // Vincular todas as permissões ao perfil Admin
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

  private async seedDefaultFarmData(tenantClient: any, fazendaId: number): Promise<void> {
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
