import { DomainError } from '../../../../common/errors/domain-error';
import type { InvitationDependencies } from '../ports/invitation.repository';
import { deliverInvitation, newInvitation } from './invitation.helpers';

export class InviteInvitationUseCase {
  constructor(private readonly dependencies: InvitationDependencies) {}

  async execute(input: { email: string; role: string }) {
    const candidate = newInvitation(this.dependencies, input);
    const duplicate = await this.dependencies.invitations.findPending(
      candidate.record.organizationId,
      candidate.record.email,
    );
    if (duplicate) {
      throw new DomainError(
        'invitationAlreadyPending',
        'Já existe um convite pendente para este e-mail',
      );
    }

    const invitation = await this.dependencies.invitations.create(
      candidate.record,
    );
    await deliverInvitation(
      this.dependencies,
      invitation,
      candidate.plainToken,
    );
    return { ...invitation, plainToken: candidate.plainToken };
  }
}
