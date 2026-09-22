import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { ProfileRepository } from '../ports/team.repository';
import {
  requireProfileOwner,
  validatePermissionSelection,
} from './profile.helpers';

export class UpdateProfileUseCase {
  constructor(
    private readonly teams: ProfileRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(input: {
    profileId: number;
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }) {
    const tenant = await requireProfileOwner(this.teams, this.context);
    const profile = await this.teams.findById(tenant.farmId, input.profileId);
    if (!profile) {
      throw new DomainError('profileNotFound', 'Perfil não encontrado');
    }
    if (profile.systemRole !== null) {
      throw new DomainError(
        'systemProfileImmutable',
        'Perfil de sistema é imutável',
      );
    }
    const name = input.name.trim();
    const duplicate = await this.teams.findByName(tenant.farmId, name);
    if (duplicate && duplicate.id !== profile.id) {
      throw new DomainError(
        'profileNameAlreadyExists',
        'Nome de perfil já utilizado',
      );
    }
    const permissionIds = await validatePermissionSelection(
      this.teams,
      input.permissionIds,
    );
    return this.teams.update(profile.id, {
      name,
      description: input.description,
      permissionIds,
    });
  }
}
