import { DomainError } from '../../common/errors/domain-error';

export enum ProvisioningState {
  REGISTERED = 'registered',
  PROVISIONING_SCHEMA = 'provisioningSchema',
  APPLYING_MIGRATIONS = 'applyingMigrations',
  SEEDING = 'seeding',
  VALIDATING = 'validating',
  ACTIVE = 'active',
}

export interface ProvisioningRunIdentity {
  readonly id: string;
  readonly tenantRegistryId: string;
}

export interface RestoredProvisioningRun extends ProvisioningRunIdentity {
  readonly state: ProvisioningState;
}

const nextState: Readonly<
  Partial<Record<ProvisioningState, ProvisioningState>>
> = {
  [ProvisioningState.REGISTERED]: ProvisioningState.PROVISIONING_SCHEMA,
  [ProvisioningState.PROVISIONING_SCHEMA]:
    ProvisioningState.APPLYING_MIGRATIONS,
  [ProvisioningState.APPLYING_MIGRATIONS]: ProvisioningState.SEEDING,
  [ProvisioningState.SEEDING]: ProvisioningState.VALIDATING,
  [ProvisioningState.VALIDATING]: ProvisioningState.ACTIVE,
};

export class ProvisioningRun {
  private constructor(
    readonly id: string,
    readonly tenantRegistryId: string,
    private currentState: ProvisioningState,
  ) {
    if (id.trim().length === 0 || tenantRegistryId.trim().length === 0) {
      throw new DomainError(
        'invalidProvisioningRun',
        'Provisioning run exige identificadores válidos',
      );
    }
  }

  static start(identity: ProvisioningRunIdentity): ProvisioningRun {
    return new ProvisioningRun(
      identity.id,
      identity.tenantRegistryId,
      ProvisioningState.REGISTERED,
    );
  }

  static restore(snapshot: RestoredProvisioningRun): ProvisioningRun {
    return new ProvisioningRun(
      snapshot.id,
      snapshot.tenantRegistryId,
      snapshot.state,
    );
  }

  get state(): ProvisioningState {
    return this.currentState;
  }

  transitionTo(target: ProvisioningState): void {
    if (nextState[this.currentState] !== target) {
      throw new DomainError(
        'invalidProvisioningTransition',
        `Transição de provisionamento inválida: ${this.currentState} -> ${target}`,
      );
    }

    this.currentState = target;
  }
}
