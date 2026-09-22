import type { InvitationDependencies } from '../ports/invitation.repository';
import { assertAvailable } from './invitation.helpers';

export class RevokeInvitationUseCase {
  constructor(private readonly dependencies: InvitationDependencies) {}

  async execute(input: { invitationId: string }) {
    const identity = this.dependencies.context.requireTenantIdentity();
    const invitation = assertAvailable(
      await this.dependencies.invitations.findById(input.invitationId),
      identity.organizationId,
    );
    return this.dependencies.invitations.revoke(
      invitation.id,
      this.dependencies.clock.now(),
    );
  }
}
