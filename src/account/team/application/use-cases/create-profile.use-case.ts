import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { ProfileRepository } from '../ports/team.repository';
import {
  requireProfileOwner,
  validatePermissionSelection,
} from './profile.helpers';

export class CreateProfileUseCase {
  constructor(
    private readonly teams: ProfileRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(input: {
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }) {
    const tenant = await requireProfileOwner(this.teams, this.context);
    const name = input.name.trim();
    if (await this.teams.findByName(tenant.farmId, name)) {
      throw new DomainError(
        'profileNameAlreadyExists',
        'Nome de perfil já utilizado',
      );
    }
    const permissionIds = await validatePermissionSelection(
      this.teams,
      input.permissionIds,
    );
    return this.teams.create({
      farmId: tenant.farmId,
      name,
      description: input.description,
      permissionIds,
    });
  }
}
