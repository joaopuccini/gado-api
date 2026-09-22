import { DomainError } from '../../../../common/errors/domain-error';
import type {
  InvitationDependencies,
  InvitationRecord,
} from '../ports/invitation.repository';

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export const newInvitation = (
  dependencies: InvitationDependencies,
  input: { email: string; role: string },
): { record: Omit<InvitationRecord, 'id'>; plainToken: string } => {
  const identity = dependencies.context.requireTenantIdentity();
  const now = dependencies.clock.now();
  const plainToken = dependencies.tokens.generate();
  return {
    plainToken,
    record: {
      organizationId: identity.organizationId,
      email: input.email.trim().toLowerCase(),
      invitedByGlobalUserId: identity.globalUserId,
      role: input.role,
      tokenHash: dependencies.hasher.hash(plainToken),
      status: 'pending',
      expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
      acceptedAt: null,
      revokedAt: null,
    },
  };
};

export const assertAvailable = (
  invitation: InvitationRecord | null,
  organizationId: string,
): InvitationRecord => {
  if (
    !invitation ||
    invitation.organizationId !== organizationId ||
    invitation.status !== 'pending'
  ) {
    throw new DomainError('invitationUnavailable', 'Convite indisponível');
  }
  return invitation;
};

export const deliverInvitation = async (
  dependencies: InvitationDependencies,
  invitation: InvitationRecord,
  plainToken: string,
): Promise<void> => {
  await dependencies.outbox.enqueue({
    invitationId: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email,
    plainToken,
  });
};
