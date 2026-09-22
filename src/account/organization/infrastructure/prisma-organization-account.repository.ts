import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import type {
  OrganizationAccountRecord,
  OrganizationAccountRepository,
} from '../application/ports/organization-account.repository';

const statusMap = {
  TRIAL: 'trial',
  ATIVO: 'active',
  SUSPENSO: 'suspended',
  CANCELADO: 'canceled',
} as const;

@Injectable()
export class PrismaOrganizationAccountRepository implements OrganizationAccountRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async findById(
    organizationId: string,
  ): Promise<OrganizationAccountRecord | null> {
    const organization = await this.database.organizacao.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        nomeFantasia: true,
        razaoSocial: true,
        email: true,
        telefone: true,
        status: true,
      },
    });
    return organization
      ? {
          organizationId: organization.id,
          name: organization.nomeFantasia,
          legalName: organization.razaoSocial,
          email: organization.email,
          phone: organization.telefone,
          status: statusMap[organization.status],
        }
      : null;
  }
}
