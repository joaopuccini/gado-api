import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type {
  OrganizationMemberDirectory,
  TeamMembershipRepository,
} from '../ports/team.repository';

export class AssignMemberUseCase {
  constructor(
    private readonly directory: OrganizationMemberDirectory,
    private readonly teams: TeamMembershipRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(input: {
    globalUserId: string;
    farmId: number;
    role: string;
    profileId: number | null;
  }) {
    const tenant = this.context.requireTenant();
    if (!tenant.accessibleFarmIds.includes(input.farmId)) {
      throw new DomainError('farmAccessDenied', 'Acesso à fazenda negado');
    }
    const user = await this.directory.findAccepted(
      tenant.organizationId,
      input.globalUserId,
    );
    if (!user) {
      throw new DomainError(
        'organizationAccessRequired',
        'Acesso aceito à organização é obrigatório',
      );
    }
    return this.teams.assignMembership({
      user,
      farmId: input.farmId,
      role: input.role,
      profileId: input.profileId,
    });
  }
}
