import {
  ExecutionContextStore,
  type ExecutionContextData,
} from './execution-context.store';
import { DomainError } from '../errors/domain-error';

const capturedErrorCode = (action: () => unknown): string => {
  try {
    action();
    throw new Error('Expected action to throw');
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return error.code;
    }
    throw error;
  }
};

const contextFor = (tenantId: string): ExecutionContextData => ({
  requestId: `request-${tenantId}`,
  traceId: `trace-${tenantId}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId,
  organizationId: `organization-${tenantId}`,
  schemaName: `tenant_${tenantId.toLowerCase()}`,
  globalUserId: `global-${tenantId}`,
  localUserId: 1,
  farmId: 1,
  accessibleFarmIds: [1],
  permissions: ['animals.read'],
});

describe('ExecutionContextStore', () => {
  let store: ExecutionContextStore;

  beforeEach(() => {
    store = new ExecutionContextStore();
  });

  it('fails closed when an execution context is required but absent', () => {
    expect(capturedErrorCode(() => store.require())).toBe(
      'executionContextMissing',
    );
  });

  it('fails closed when tenant context is required but absent', () => {
    const publicContext: ExecutionContextData = {
      ...contextFor('tenantA'),
      contextType: 'public',
      tenantId: undefined,
      organizationId: undefined,
      schemaName: undefined,
      globalUserId: undefined,
      localUserId: undefined,
      farmId: undefined,
      accessibleFarmIds: [],
      permissions: [],
    };

    expect(
      capturedErrorCode(() =>
        store.run(publicContext, () => store.requireTenant()),
      ),
    ).toBe('tenantContextMissing');
  });

  it('keeps two concurrent tenant contexts isolated', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = store.run(contextFor('tenantA'), async () => {
      await gate;
      return store.requireTenant().tenantId;
    });
    const second = store.run(contextFor('tenantB'), async () => {
      await gate;
      return store.requireTenant().tenantId;
    });

    release();

    await expect(Promise.all([first, second])).resolves.toEqual([
      'tenantA',
      'tenantB',
    ]);
  });

  it('enriches only the active execution with verified tenant data', () => {
    const publicContext: ExecutionContextData = {
      ...contextFor('tenantA'),
      contextType: 'public',
      tenantId: undefined,
      organizationId: undefined,
      schemaName: undefined,
      globalUserId: undefined,
      localUserId: undefined,
      farmId: undefined,
      accessibleFarmIds: [],
      permissions: [],
    };

    store.run(publicContext, () => {
      store.enrichTenant({
        tenantId: 'tenantA',
        organizationId: 'organization-tenantA',
        schemaName: 'tenant_tenanta',
        globalUserId: 'global-tenantA',
        localUserId: 1,
        farmId: 1,
        accessibleFarmIds: [1],
        permissions: ['animals.read'],
      });

      expect(store.requireTenant()).toMatchObject({
        contextType: 'tenant',
        tenantId: 'tenantA',
        schemaName: 'tenant_tenanta',
      });
    });

    expect(store.current()).toBeUndefined();
  });
});
