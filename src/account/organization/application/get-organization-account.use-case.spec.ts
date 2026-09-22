import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../common/context';
import type { OrganizationAccountRepository } from './ports/organization-account.repository';
import { GetOrganizationAccountUseCase } from './get-organization-account.use-case';

const contextData = (organizationId: string): ExecutionContextData => ({
  requestId: 'request-1',
  traceId: 'trace-1',
  contextType: 'tenant',
  startedAt: 0,
  tenantId: 'tenant-1',
  organizationId,
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: 'user-1',
  accessibleFarmIds: [1],
  permissions: ['configuracoes:ler'],
});

describe('GetOrganizationAccountUseCase', () => {
  const context = new ExecutionContextStore();
  const organizations: jest.Mocked<OrganizationAccountRepository> = {
    findById: jest.fn(),
  };
  const useCase = new GetOrganizationAccountUseCase(organizations, context);

  beforeEach(() => jest.clearAllMocks());

  it('reads by verified organization and exposes only the account view', async () => {
    organizations.findById.mockResolvedValue({
      organizationId: 'organization-a',
      name: 'Fazendas A',
      legalName: 'Fazendas A Ltda',
      email: 'contato@example.com',
      phone: null,
      status: 'active',
    });

    const result = await context.run(contextData('organization-a'), () =>
      useCase.execute(),
    );

    expect(organizations.findById.mock.calls).toEqual([['organization-a']]);
    expect(result).toEqual({
      name: 'Fazendas A',
      legalName: 'Fazendas A Ltda',
      contact: { email: 'contato@example.com', phone: null },
      status: 'active',
    });
    expect(result).not.toHaveProperty('organizationId');
  });

  it('rejects a repository result from another organization', async () => {
    organizations.findById.mockResolvedValue({
      organizationId: 'organization-b',
      name: 'Fazendas B',
      legalName: 'Fazendas B Ltda',
      email: 'b@example.com',
      phone: null,
      status: 'active',
    });

    await expect(
      context.run(contextData('organization-a'), () => useCase.execute()),
    ).rejects.toMatchObject({ code: 'organizationUnavailable' });
  });
});
