export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface InvitationRecord {
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

export interface InvitationRepository {
  listByOrganization(
    organizationId: string,
  ): Promise<readonly InvitationRecord[]>;
  findPending(
    organizationId: string,
    email: string,
  ): Promise<InvitationRecord | null>;
  findById(id: string): Promise<InvitationRecord | null>;
  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null>;
  create(input: Omit<InvitationRecord, 'id'>): Promise<InvitationRecord>;
  accept(id: string, acceptedAt: Date): Promise<InvitationRecord>;
  revoke(id: string, revokedAt: Date): Promise<InvitationRecord>;
  replacePending(
    currentId: string,
    revokedAt: Date,
    replacement: Omit<InvitationRecord, 'id'>,
  ): Promise<InvitationRecord>;
}

export interface InvitationOutbox {
  enqueue(input: {
    invitationId: string;
    organizationId: string;
    email: string;
    plainToken: string;
  }): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface TokenGenerator {
  generate(): string;
}

export interface TokenHasher {
  hash(token: string): string;
}

export interface InvitationDependencies {
  readonly invitations: InvitationRepository;
  readonly outbox: InvitationOutbox;
  readonly context: import('../../../../common/context').ExecutionContextStore;
  readonly clock: Clock;
  readonly tokens: TokenGenerator;
  readonly hasher: TokenHasher;
}

export const INVITATION_REPOSITORY = Symbol('INVITATION_REPOSITORY');
export const INVITATION_OUTBOX = Symbol('INVITATION_OUTBOX');
