import { DomainError } from '../../../common/errors/domain-error';
import type {
  PublicProvisioningState,
  TenantOnboardingRepository,
} from '../ports/tenant-onboarding.repository';

export class GetProvisioningStatusUseCase {
  constructor(private readonly repository: TenantOnboardingRepository) {}

  async execute(
    provisioningRunId: string,
    globalUserId: string,
  ): Promise<{
    readonly provisioningRunId: string;
    readonly state: PublicProvisioningState;
  }> {
    const state = await this.repository.findOwnedStatus(
      provisioningRunId,
      globalUserId,
    );
    if (!state) {
      throw new DomainError(
        'resourceNotFound',
        'Provisionamento não encontrado',
      );
    }
    return { provisioningRunId, state };
  }
}
