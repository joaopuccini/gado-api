import { DomainError } from '../../../../common/errors/domain-error';
import type { InvitationDependencies } from '../ports/invitation.repository';
import { assertAvailable } from './invitation.helpers';

export class AcceptInvitationUseCase {
  constructor(private readonly dependencies: InvitationDependencies) {}

  async execute(input: { token: string }) {
    const identity = this.dependencies.context.requireTenantIdentity();
    const invitation = assertAvailable(
      await this.dependencies.invitations.findByTokenHash(
        this.dependencies.hasher.hash(input.token),
      ),
      identity.organizationId,
    );
    const now = this.dependencies.clock.now();
    if (invitation.expiresAt.getTime() <= now.getTime()) {
      throw new DomainError('invitationExpired', 'Convite expirado');
    }
    return this.dependencies.invitations.accept(invitation.id, now);
  }
}
