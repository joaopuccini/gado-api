import type { ExecutionContextStore } from '../../../../common/context';
import type {
  Clock,
  InvitationRepository,
} from '../ports/invitation.repository';
import type { TeamRepository } from '../ports/team.repository';

export class GetTeamSummaryUseCase {
  constructor(
    private readonly teams: TeamRepository,
    private readonly invitations: InvitationRepository,
    private readonly context: ExecutionContextStore,
    private readonly clock: Clock,
  ) {}

  async execute() {
    const identity = this.context.requireTenantIdentity();
    const [summary, invitations] = await Promise.all([
      this.teams.getSummary(identity.accessibleFarmIds),
      this.invitations.listByOrganization(identity.organizationId),
    ]);
    const now = this.clock.now().getTime();
    return {
      ...summary,
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status:
          invitation.status === 'pending' &&
          invitation.expiresAt.getTime() <= now
            ? 'expired'
            : invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      })),
    };
  }
}
