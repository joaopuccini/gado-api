import { DEFAULT_PROFILE_PERMISSIONS } from '../../../common/rbac/default-profiles';
import type { DefaultProfileRepository } from '../ports/default-profile.repository';

export class SeedProfilesService {
  constructor(private readonly repository: DefaultProfileRepository) {}

  async execute(): Promise<void> {
    await this.repository.seed(DEFAULT_PROFILE_PERMISSIONS);
  }
}
