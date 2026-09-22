import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../../common/context';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';
import { InviteInvitationUseCase } from './invite-invitation.use-case';
import { ResendInvitationUseCase } from './resend-invitation.use-case';
import { RevokeInvitationUseCase } from './revoke-invitation.use-case';

type InvitationStatus = 'pending' | 'accepted' | 'revoked';

interface InvitationRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly invitedByGlobalUserId: string;
  readonly role: string;
  readonly tokenHash: string;
  readonly status: InvitationStatus;
  readonly expiresAt: Date;
  readonly acceptedAt: Date | null;
  readonly revokedAt: Date | null;
}

interface InvitationRepository {
  findPending(
    organizationId: string,
    email: string,
  ): Promise<InvitationRecord | null>;
  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null>;
  findById(id: string): Promise<InvitationRecord | null>;
  create(input: Omit<InvitationRecord, 'id'>): Promise<InvitationRecord>;
  accept(id: string, acceptedAt: Date): Promise<InvitationRecord>;
  revoke(id: string, revokedAt: Date): Promise<InvitationRecord>;
  replacePending(
    currentId: string,
    revokedAt: Date,
    replacement: Omit<InvitationRecord, 'id'>,
  ): Promise<InvitationRecord>;
}

interface InvitationOutbox {
  enqueue(input: {
    invitationId: string;
    organizationId: string;
    email: string;
    plainToken: string;
  }): Promise<void>;
}

class MemoryInvitationRepository implements InvitationRepository {
  readonly records: InvitationRecord[] = [];

  findPending(
    organizationId: string,
    email: string,
  ): Promise<InvitationRecord | null> {
    return Promise.resolve(
      this.records.find(
        (record) =>
          record.organizationId === organizationId &&
          record.email === email &&
          record.status === 'pending',
      ) ?? null,
    );
  }

  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null> {
    return Promise.resolve(
      this.records.find((record) => record.tokenHash === tokenHash) ?? null,
    );
  }

  findById(id: string): Promise<InvitationRecord | null> {
    return Promise.resolve(
      this.records.find((record) => record.id === id) ?? null,
    );
  }

  create(input: Omit<InvitationRecord, 'id'>): Promise<InvitationRecord> {
    const record = { ...input, id: `invitation-${this.records.length + 1}` };
    this.records.push(record);
    return Promise.resolve(record);
  }

  accept(id: string, acceptedAt: Date): Promise<InvitationRecord> {
    return Promise.resolve(
      this.replace(id, { status: 'accepted', acceptedAt }),
    );
  }

  revoke(id: string, revokedAt: Date): Promise<InvitationRecord> {
    return Promise.resolve(this.replace(id, { status: 'revoked', revokedAt }));
  }

  async replacePending(
    currentId: string,
    revokedAt: Date,
    replacement: Omit<InvitationRecord, 'id'>,
  ): Promise<InvitationRecord> {
    this.replace(currentId, { status: 'revoked', revokedAt });
    return this.create(replacement);
  }

  private replace(
    id: string,
    changes: Partial<InvitationRecord>,
  ): InvitationRecord {
    const index = this.records.findIndex((record) => record.id === id);
    const updated = { ...this.records[index], ...changes } as InvitationRecord;
    this.records[index] = updated;
    return updated;
  }
}

const NOW = new Date('2026-09-22T15:00:00.000Z');
const EXPIRES_AT = new Date('2026-09-29T15:00:00.000Z');

const tenantContext = (
  organizationId = 'organization-a',
): ExecutionContextData => ({
  requestId: `request-${organizationId}`,
  traceId: `trace-${organizationId}`,
  contextType: 'tenant',
  startedAt: NOW.getTime(),
  tenantId: `tenant-${organizationId}`,
  organizationId,
  schemaName: `tenant_${organizationId.replaceAll('-', '_')}`,
  globalUserId: 'owner-a',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['team:manage'],
});

describe('Invitation lifecycle', () => {
  let invitations: MemoryInvitationRepository;
  let outbox: jest.Mocked<InvitationOutbox>;
  let context: ExecutionContextStore;
  let nextToken: number;

  const dependencies = () => ({
    invitations,
    outbox,
    context,
    clock: { now: () => NOW },
    tokens: { generate: () => `plain-token-${++nextToken}` },
    hasher: {
      hash: (token: string) => Buffer.from(token).toString('base64'),
    },
  });

  const run = <T>(callback: () => Promise<T>, organizationId?: string) =>
    context.run(tenantContext(organizationId), callback);

  beforeEach(() => {
    invitations = new MemoryInvitationRepository();
    outbox = { enqueue: jest.fn().mockResolvedValue(undefined) };
    context = new ExecutionContextStore();
    nextToken = 0;
  });

  it('creates a normalized invitation, stores only its hash, and enqueues delivery', async () => {
    const useCase = new InviteInvitationUseCase(dependencies());

    const result = await run(() =>
      useCase.execute({ email: '  MEMBER@Example.com ', role: 'MEMBRO' }),
    );

    expect(result).toMatchObject({
      id: 'invitation-1',
      email: 'member@example.com',
      plainToken: 'plain-token-1',
      expiresAt: EXPIRES_AT,
    });
    expect(invitations.records[0]).toMatchObject({
      organizationId: 'organization-a',
      email: 'member@example.com',
      invitedByGlobalUserId: 'owner-a',
      tokenHash: 'cGxhaW4tdG9rZW4tMQ==',
      status: 'pending',
      expiresAt: EXPIRES_AT,
    });
    expect(JSON.stringify(invitations.records[0])).not.toContain(
      'plain-token-1',
    );
    expect(outbox.enqueue.mock.calls).toEqual([
      [
        {
          invitationId: 'invitation-1',
          organizationId: 'organization-a',
          email: 'member@example.com',
          plainToken: 'plain-token-1',
        },
      ],
    ]);
  });

  it('rejects a duplicate pending email in the same organization', async () => {
    const useCase = new InviteInvitationUseCase(dependencies());
    await run(() =>
      useCase.execute({ email: 'member@example.com', role: 'MEMBRO' }),
    );

    await expect(
      run(() =>
        useCase.execute({ email: 'MEMBER@example.com', role: 'MEMBRO' }),
      ),
    ).rejects.toMatchObject({ code: 'invitationAlreadyPending' });
  });

  it('accepts a valid invitation exactly once', async () => {
    const invite = new InviteInvitationUseCase(dependencies());
    const accept = new AcceptInvitationUseCase(dependencies());
    const created = await run(() =>
      invite.execute({ email: 'member@example.com', role: 'MEMBRO' }),
    );

    await expect(
      run(() => accept.execute({ token: created.plainToken })),
    ).resolves.toMatchObject({ status: 'accepted', acceptedAt: NOW });
    await expect(
      run(() => accept.execute({ token: created.plainToken })),
    ).rejects.toMatchObject({ code: 'invitationUnavailable' });
  });

  it('rejects an expired invitation', async () => {
    await invitations.create({
      organizationId: 'organization-a',
      email: 'member@example.com',
      invitedByGlobalUserId: 'owner-a',
      role: 'MEMBRO',
      tokenHash: 'ZXhwaXJlZC10b2tlbg==',
      status: 'pending',
      expiresAt: new Date('2026-09-22T14:59:59.000Z'),
      acceptedAt: null,
      revokedAt: null,
    });
    const accept = new AcceptInvitationUseCase(dependencies());

    await expect(
      run(() => accept.execute({ token: 'expired-token' })),
    ).rejects.toMatchObject({ code: 'invitationExpired' });
  });

  it('resends by revoking the previous token and issuing a new invitation', async () => {
    const invite = new InviteInvitationUseCase(dependencies());
    const resend = new ResendInvitationUseCase(dependencies());
    const previous = await run(() =>
      invite.execute({ email: 'member@example.com', role: 'MEMBRO' }),
    );

    const replacement = await run(() =>
      resend.execute({ invitationId: previous.id }),
    );

    expect(invitations.records[0]).toMatchObject({
      status: 'revoked',
      revokedAt: NOW,
    });
    expect(replacement).toMatchObject({
      id: 'invitation-2',
      plainToken: 'plain-token-2',
    });
  });

  it('revokes a pending invitation', async () => {
    const invite = new InviteInvitationUseCase(dependencies());
    const revoke = new RevokeInvitationUseCase(dependencies());
    const created = await run(() =>
      invite.execute({ email: 'member@example.com', role: 'MEMBRO' }),
    );

    await expect(
      run(() => revoke.execute({ invitationId: created.id })),
    ).resolves.toMatchObject({ status: 'revoked', revokedAt: NOW });
  });

  it('denies a token issued by another organization', async () => {
    const invite = new InviteInvitationUseCase(dependencies());
    const accept = new AcceptInvitationUseCase(dependencies());
    const created = await run(
      () => invite.execute({ email: 'member@example.com', role: 'MEMBRO' }),
      'organization-b',
    );

    await expect(
      run(() => accept.execute({ token: created.plainToken })),
    ).rejects.toMatchObject({ code: 'invitationUnavailable' });
  });
});
