import { DomainError } from '../../common/errors/domain-error';
import { ProvisioningRun, ProvisioningState } from './provisioning-run';

const expectDomainError = (
  operation: () => void,
  code: DomainError['code'],
): void => {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(DomainError);
    if (!(error instanceof DomainError)) return;
    expect(error.code).toBe(code);
    return;
  }

  throw new Error(`Expected DomainError ${code}`);
};

describe('ProvisioningRun state machine', () => {
  it('starts registered and advances through every provisioning stage', () => {
    const run = ProvisioningRun.start({
      id: 'run-1',
      tenantRegistryId: 'tenant-1',
    });

    expect(run.state).toBe(ProvisioningState.REGISTERED);

    const sequence = [
      ProvisioningState.PROVISIONING_SCHEMA,
      ProvisioningState.APPLYING_MIGRATIONS,
      ProvisioningState.SEEDING,
      ProvisioningState.VALIDATING,
      ProvisioningState.ACTIVE,
    ];

    for (const state of sequence) {
      run.transitionTo(state);
      expect(run.state).toBe(state);
    }
  });

  it.each([
    [ProvisioningState.REGISTERED, ProvisioningState.APPLYING_MIGRATIONS],
    [ProvisioningState.PROVISIONING_SCHEMA, ProvisioningState.SEEDING],
    [ProvisioningState.APPLYING_MIGRATIONS, ProvisioningState.ACTIVE],
    [ProvisioningState.ACTIVE, ProvisioningState.VALIDATING],
  ])('rejects transition from %s to %s', (current, target) => {
    const run = ProvisioningRun.restore({
      id: 'run-1',
      tenantRegistryId: 'tenant-1',
      state: current,
    });

    expectDomainError(
      () => run.transitionTo(target),
      'invalidProvisioningTransition',
    );
    expect(run.state).toBe(current);
  });

  it('rejects an empty run or tenant registry identity', () => {
    expectDomainError(
      () =>
        void ProvisioningRun.start({
          id: ' ',
          tenantRegistryId: 'tenant-1',
        }),
      'invalidProvisioningRun',
    );
    expectDomainError(
      () =>
        void ProvisioningRun.start({
          id: 'run-1',
          tenantRegistryId: '',
        }),
      'invalidProvisioningRun',
    );
  });
});
