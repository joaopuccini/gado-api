import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ExecutionContextStore } from '../../../common/context';
import type { TenantBootstrapRepository } from '../ports/tenant-bootstrap.repository';
import { ProvisionTenantOrchestratorUseCase } from './provision-tenant-orchestrator.use-case';
import { ProvisionTenantUseCase } from './provision-tenant.use-case';

describe('ProvisionTenantUseCase', () => {
  const command = {
    provisioningRunId: '11111111-1111-4111-8111-111111111111',
    globalUserId: '22222222-2222-4222-8222-222222222222',
    ownerName: 'Owner',
    ownerEmail: 'owner@example.com',
    passwordHash: 'stored-hash',
    farmName: 'Fazenda Principal',
  };
  const resources = { localUserId: 41, farmId: 7, userFarmId: 91 };
  const repository: jest.Mocked<TenantBootstrapRepository> = {
    bootstrap: jest.fn(),
    smokeCheck: jest.fn(),
  };
  const useCase = new ProvisionTenantUseCase(repository);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.bootstrap.mockResolvedValue(resources);
    repository.smokeCheck.mockResolvedValue(true);
  });

  it('creates the owner, main farm and owner link before smoke validation', async () => {
    const order: string[] = [];
    repository.bootstrap.mockImplementation(async () => {
      order.push('bootstrap');
      return resources;
    });
    repository.smokeCheck.mockImplementation(async () => {
      order.push('smokeCheck');
      return true;
    });

    await expect(useCase.execute(command)).resolves.toEqual(resources);

    expect(order).toEqual(['bootstrap', 'smokeCheck']);
    expect(repository.bootstrap).toHaveBeenCalledWith(command);
    expect(repository.smokeCheck).toHaveBeenCalledWith(resources);
  });

  it('returns the same resource identities when the same run is retried', async () => {
    await expect(useCase.execute(command)).resolves.toEqual(resources);
    await expect(useCase.execute(command)).resolves.toEqual(resources);

    expect(repository.bootstrap).toHaveBeenCalledTimes(2);
    expect(repository.smokeCheck).toHaveBeenCalledTimes(2);
  });

  it('fails closed when smoke validation cannot read the complete graph', async () => {
    repository.smokeCheck.mockResolvedValue(false);

    await expect(useCase.execute(command)).rejects.toMatchObject({
      code: 'tenantSmokeCheckFailed',
    });
  });
});

describe('ProvisionTenantOrchestratorUseCase', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  const context = new ExecutionContextStore();
  const sequence: string[] = [];
  const stage = (name: string) => ({
    execute: jest.fn().mockImplementation(async () => {
      expect(context.requireTenantIdentity()).toMatchObject({
        contextType: 'job',
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName,
        globalUserId: 'global-user-id',
      });
      sequence.push(name);
    }),
  });
  const createSchema = stage('createSchema');
  const migrateSchema = stage('migrateSchema');
  const syncPermissions = stage('syncPermissions');
  const seedProfiles = stage('seedProfiles');
  const provisionTenant = stage('provisionTenant');
  const orchestrator = new ProvisionTenantOrchestratorUseCase(
    context,
    createSchema,
    migrateSchema,
    syncPermissions,
    seedProfiles,
    provisionTenant,
    () => 'request-id',
    () => 123,
  );
  const command = {
    tenantId: 'tenant-id',
    organizationId: 'organization-id',
    schemaName,
    globalUserId: 'global-user-id',
    bootstrap: {
      provisioningRunId: '11111111-1111-4111-8111-111111111111',
      globalUserId: 'global-user-id',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      passwordHash: 'stored-hash',
      farmName: 'Fazenda Principal',
    },
  };

  beforeEach(() => {
    sequence.length = 0;
    jest.clearAllMocks();
  });

  it('executes every provisioning stage in the required order', async () => {
    await orchestrator.execute(command);

    expect(sequence).toEqual([
      'createSchema',
      'migrateSchema',
      'syncPermissions',
      'seedProfiles',
      'provisionTenant',
    ]);
    expect(context.current()).toBeUndefined();
  });

  it('does not execute later stages after a failure', async () => {
    syncPermissions.execute.mockRejectedValueOnce(new Error('sync failed'));

    await expect(orchestrator.execute(command)).rejects.toThrow('sync failed');
    expect(sequence).toEqual(['createSchema', 'migrateSchema']);
    expect(seedProfiles.execute).not.toHaveBeenCalled();
    expect(provisionTenant.execute).not.toHaveBeenCalled();
  });
});

describe('tenant bootstrap schema contract', () => {
  it('defines durable uniqueness keys for owner and main farm retries', () => {
    const schema = readFileSync(
      resolve(process.cwd(), 'prisma/tenant/schema.prisma'),
      'utf8',
    );

    expect(schema).toMatch(
      /model Usuario \{[\s\S]*globalUserId\s+String\?\s+@unique\s+@map\("global_user_id"\)/,
    );
    expect(schema).toMatch(
      /model Fazenda \{[\s\S]*provisioningRunId\s+String\?\s+@unique\s+@map\("provisioning_run_id"\)\s+@db\.Uuid/,
    );
  });
});
