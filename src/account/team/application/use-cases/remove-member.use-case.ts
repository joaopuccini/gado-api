import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { TeamMembershipRepository } from '../ports/team.repository';

export class RemoveMemberUseCase {
  constructor(
    private readonly teams: TeamMembershipRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(input: { localUserId: number; farmId: number }) {
    const tenant = this.context.requireTenant();
    if (!tenant.accessibleFarmIds.includes(input.farmId)) {
      throw new DomainError('farmAccessDenied', 'Acesso à fazenda negado');
    }
    const membership = await this.teams.deactivateMembership(input);
    if (!membership) {
      throw new DomainError('teamMemberNotFound', 'Membro não encontrado');
    }
    return membership;
  }
}
