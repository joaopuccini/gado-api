import { DomainError } from '../../common/errors/domain-error';
import {
  ProvisioningRun,
  ProvisioningState,
} from './provisioning-run';

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

    expect(() => run.transitionTo(target)).toThrow(
      expect.objectContaining<Partial<DomainError>>({
        code: 'invalidProvisioningTransition',
      }),
    );
    expect(run.state).toBe(current);
  });

  it('rejects an empty run or tenant registry identity', () => {
    expect(() =>
      ProvisioningRun.start({ id: ' ', tenantRegistryId: 'tenant-1' }),
    ).toThrow(
      expect.objectContaining<Partial<DomainError>>({
        code: 'invalidProvisioningRun',
      }),
    );
    expect(() =>
      ProvisioningRun.start({ id: 'run-1', tenantRegistryId: '' }),
    ).toThrow(
      expect.objectContaining<Partial<DomainError>>({
        code: 'invalidProvisioningRun',
      }),
    );
  });
});
