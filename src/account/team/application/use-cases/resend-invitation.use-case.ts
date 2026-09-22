import type { InvitationDependencies } from '../ports/invitation.repository';
import {
  assertAvailable,
  deliverInvitation,
  newInvitation,
} from './invitation.helpers';

export class ResendInvitationUseCase {
  constructor(private readonly dependencies: InvitationDependencies) {}

  async execute(input: { invitationId: string }) {
    const identity = this.dependencies.context.requireTenantIdentity();
    const current = assertAvailable(
      await this.dependencies.invitations.findById(input.invitationId),
      identity.organizationId,
    );
    const replacement = newInvitation(this.dependencies, {
      email: current.email,
      role: current.role,
    });
    const invitation = await this.dependencies.invitations.replacePending(
      current.id,
      this.dependencies.clock.now(),
      replacement.record,
    );
    await deliverInvitation(
      this.dependencies,
      invitation,
      replacement.plainToken,
    );
    return { ...invitation, plainToken: replacement.plainToken };
  }
}
