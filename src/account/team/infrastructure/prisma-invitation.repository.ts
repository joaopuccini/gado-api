import {
  RoleOrganizacao,
  StatusConvite,
  type Convite,
} from '@prisma/client-admin';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import type {
  InvitationRecord,
  InvitationRepository,
} from '../application/ports/invitation.repository';

const statusFrom = (status: StatusConvite): InvitationRecord['status'] => {
  if (status === StatusConvite.ACEITO) return 'accepted';
  if (status === StatusConvite.CANCELADO) return 'revoked';
  return 'pending';
};

const toRecord = (row: Convite): InvitationRecord => ({
  id: row.id,
  organizationId: row.organizacaoId,
  email: row.email,
  invitedByGlobalUserId: row.convidadoPorId,
  role: row.role,
  tokenHash: row.tokenHash,
  status: statusFrom(row.status),
  expiresAt: row.expiresAt,
  acceptedAt: row.acceptedAt,
  revokedAt: row.revokedAt,
});

const createData = (input: Omit<InvitationRecord, 'id'>) => ({
  organizacaoId: input.organizationId,
  email: input.email,
  convidadoPorId: input.invitedByGlobalUserId,
  role: input.role as RoleOrganizacao,
  tokenHash: input.tokenHash,
  status: StatusConvite.PENDENTE,
  expiresAt: input.expiresAt,
});

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async findPending(
    organizationId: string,
    email: string,
  ): Promise<InvitationRecord | null> {
    const row = await this.database.convite.findFirst({
      where: {
        organizacaoId: organizationId,
        email,
        status: StatusConvite.PENDENTE,
      },
    });
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<InvitationRecord | null> {
    const row = await this.database.convite.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationRecord | null> {
    const row = await this.database.convite.findUnique({
      where: { tokenHash },
    });
    return row ? toRecord(row) : null;
  }

  async create(input: Omit<InvitationRecord, 'id'>): Promise<InvitationRecord> {
    return toRecord(
      await this.database.convite.create({ data: createData(input) }),
    );
  }

  async accept(id: string, acceptedAt: Date): Promise<InvitationRecord> {
    return toRecord(
      await this.database.convite.update({
        where: { id },
        data: { status: StatusConvite.ACEITO, acceptedAt },
      }),
    );
  }

  async revoke(id: string, revokedAt: Date): Promise<InvitationRecord> {
    return toRecord(
      await this.database.convite.update({
        where: { id },
        data: { status: StatusConvite.CANCELADO, revokedAt },
      }),
    );
  }

  async replacePending(
    currentId: string,
    revokedAt: Date,
    replacement: Omit<InvitationRecord, 'id'>,
  ): Promise<InvitationRecord> {
    return this.database.$transaction(async (transaction) => {
      await transaction.convite.update({
        where: { id: currentId },
        data: { status: StatusConvite.CANCELADO, revokedAt },
      });
      return toRecord(
        await transaction.convite.create({ data: createData(replacement) }),
      );
    });
  }
}
