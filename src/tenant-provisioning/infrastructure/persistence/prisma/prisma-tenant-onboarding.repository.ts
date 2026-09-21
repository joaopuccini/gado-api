import { randomBytes, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client-admin';
import { AdminPrismaService } from '../../../../admin/admin-prisma.service';
import type {
  PublicProvisioningState,
  StartedTenantOnboarding,
  StartTenantOnboardingCommand,
  TenantOnboardingRepository,
} from '../../../application/ports/tenant-onboarding.repository';

const provisioningState = (
  state: string,
  hasFailure: boolean,
): PublicProvisioningState => {
  if (state === 'ACTIVE') return 'active';
  if (hasFailure) return 'failed';
  if (state === 'REGISTERED') return 'registered';
  return 'provisioning';
};

const slugBase = (email: string): string =>
  email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24) || 'fazenda';

export class PrismaTenantOnboardingRepository implements TenantOnboardingRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async start(
    command: StartTenantOnboardingCommand,
  ): Promise<StartedTenantOnboarding> {
    const identity = command.providerUserId ?? command.ownerEmail;
    const idempotencyKey = `onboarding:${command.provider}:${identity}`;

    return this.database.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;

        const globalUser = await transaction.usuarioGlobal.upsert({
          where: { email: command.ownerEmail },
          create: {
            nome: command.ownerName,
            email: command.ownerEmail,
            senhaHash: command.passwordHash,
            googleId: command.providerUserId,
            authProvider: command.provider === 'google' ? 'GOOGLE' : 'EMAIL',
          },
          update: {
            nome: command.ownerName,
            ...(command.passwordHash
              ? { senhaHash: command.passwordHash }
              : {}),
            ...(command.providerUserId
              ? {
                  googleId: command.providerUserId,
                  authProvider: 'GOOGLE' as const,
                }
              : {}),
          },
        });
        const existingRun = await transaction.provisioningRun.findFirst({
          where: {
            tenantRegistry: {
              organizacao: {
                acessos: { some: { usuarioGlobalId: globalUser.id } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          include: {
            tenantRegistry: {
              include: {
                organizacao: {
                  include: { acessos: { take: 1 } },
                },
              },
            },
          },
        });
        if (existingRun) {
          return this.startedFromExisting(existingRun, command);
        }

        const suffix = randomBytes(4).toString('hex');
        const subdomain = `${slugBase(command.ownerEmail)}-${suffix}`;
        const schemaName = `tenant_${randomBytes(16).toString('hex')}`;
        const organization = await transaction.organizacao.create({
          data: {
            razaoSocial: command.ownerName,
            nomeFantasia: command.farmName ?? command.ownerName,
            email: command.ownerEmail,
            subdomain,
            schemaName,
          },
        });
        const tenant = await transaction.tenantRegistry.create({
          data: {
            organizacaoId: organization.id,
            subdomain,
            schemaName,
          },
        });
        await transaction.acessoOrganizacao.create({
          data: {
            usuarioGlobalId: globalUser.id,
            organizacaoId: organization.id,
            role: 'PROPRIETARIO',
            status: 'ATIVO',
          },
        });
        const run = await transaction.provisioningRun.create({
          data: {
            id: randomUUID(),
            tenantRegistryId: tenant.id,
            idempotencyKey: `${tenant.id}:${globalUser.id}`,
          },
        });

        return {
          provisioningRunId: run.id,
          globalUserId: globalUser.id,
          state: 'registered' as const,
          orchestration: this.orchestration(
            run.id,
            tenant.id,
            organization.id,
            schemaName,
            globalUser.id,
            command,
          ),
        };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findOwnedStatus(
    provisioningRunId: string,
    globalUserId: string,
  ): Promise<PublicProvisioningState | undefined> {
    const run = await this.database.provisioningRun.findFirst({
      where: {
        id: provisioningRunId,
        tenantRegistry: {
          organizacao: { acessos: { some: { usuarioGlobalId: globalUserId } } },
        },
      },
      select: {
        state: true,
        steps: {
          where: { status: 'FAILED' },
          select: { id: true },
          take: 1,
        },
      },
    });
    return run ? provisioningState(run.state, run.steps.length > 0) : undefined;
  }

  private startedFromExisting(
    run: Prisma.ProvisioningRunGetPayload<{
      include: {
        tenantRegistry: {
          include: { organizacao: { include: { acessos: { take: 1 } } } };
        };
      };
    }>,
    command: StartTenantOnboardingCommand,
  ): StartedTenantOnboarding {
    const access = run.tenantRegistry.organizacao.acessos[0];
    if (!access) throw new TypeError('onboardingOwnerMissing');
    return {
      provisioningRunId: run.id,
      globalUserId: access.usuarioGlobalId,
      state: run.state === 'REGISTERED' ? 'registered' : 'provisioning',
      orchestration: this.orchestration(
        run.id,
        run.tenantRegistry.id,
        run.tenantRegistry.organizacao.id,
        run.tenantRegistry.schemaName,
        access.usuarioGlobalId,
        command,
      ),
    };
  }

  private orchestration(
    provisioningRunId: string,
    tenantId: string,
    organizationId: string,
    schemaName: string,
    globalUserId: string,
    command: StartTenantOnboardingCommand,
  ) {
    return {
      tenantId,
      organizationId,
      schemaName,
      globalUserId,
      bootstrap: {
        provisioningRunId,
        globalUserId,
        ownerName: command.ownerName,
        ownerEmail: command.ownerEmail,
        passwordHash: command.passwordHash ?? '',
        farmName: command.farmName ?? 'Fazenda Principal',
      },
    };
  }
}
