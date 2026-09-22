import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../../common/context';
import { AssignMemberUseCase } from './assign-member.use-case';
import { RemoveMemberUseCase } from './remove-member.use-case';

interface AcceptedOrganizationUser {
  readonly globalUserId: string;
  readonly name: string;
  readonly email: string;
}

interface OrganizationMemberDirectory {
  findAccepted(
    organizationId: string,
    globalUserId: string,
  ): Promise<AcceptedOrganizationUser | null>;
}

interface TeamMemberView {
  readonly localUserId: number;
  readonly globalUserId: string;
  readonly farmId: number;
  readonly role: string;
  readonly profileId: number | null;
  readonly active: boolean;
}

interface TeamRepository {
  assignMembership(input: {
    user: AcceptedOrganizationUser;
    farmId: number;
    role: string;
    profileId: number | null;
  }): Promise<TeamMemberView>;
  deactivateMembership(input: {
    localUserId: number;
    farmId: number;
  }): Promise<TeamMemberView | null>;
}

class MemoryTeamRepository implements TeamRepository {
  readonly users = new Map<string, number>();
  readonly memberships = new Map<string, TeamMemberView>();
  transactionCount = 0;

  assignMembership(input: {
    user: AcceptedOrganizationUser;
    farmId: number;
    role: string;
    profileId: number | null;
  }): Promise<TeamMemberView> {
    this.transactionCount += 1;
    const localUserId =
      this.users.get(input.user.globalUserId) ?? this.users.size + 100;
    this.users.set(input.user.globalUserId, localUserId);
    const key = `${localUserId}:${input.farmId}`;
    const membership: TeamMemberView = {
      localUserId,
      globalUserId: input.user.globalUserId,
      farmId: input.farmId,
      role: input.role,
      profileId: input.profileId,
      active: true,
    };
    this.memberships.set(key, membership);
    return Promise.resolve(membership);
  }

  deactivateMembership(input: {
    localUserId: number;
    farmId: number;
  }): Promise<TeamMemberView | null> {
    this.transactionCount += 1;
    const key = `${input.localUserId}:${input.farmId}`;
    const current = this.memberships.get(key);
    if (!current) return Promise.resolve(null);
    const inactive = { ...current, active: false };
    this.memberships.set(key, inactive);
    return Promise.resolve(inactive);
  }
}

const CONTEXT: ExecutionContextData = {
  requestId: 'request-team',
  traceId: 'trace-team',
  contextType: 'tenant',
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: 'owner-a',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10, 11],
  permissions: ['team:manage'],
};

describe('team membership assignment', () => {
  let context: ExecutionContextStore;
  let directory: jest.Mocked<OrganizationMemberDirectory>;
  let teams: MemoryTeamRepository;
  let assign: AssignMemberUseCase;
  let remove: RemoveMemberUseCase;

  const run = <T>(callback: () => Promise<T>) => context.run(CONTEXT, callback);

  beforeEach(() => {
    context = new ExecutionContextStore();
    directory = {
      findAccepted: jest.fn().mockResolvedValue({
        globalUserId: 'member-a',
        name: 'Member A',
        email: 'member@example.com',
      }),
    };
    teams = new MemoryTeamRepository();
    assign = new AssignMemberUseCase(directory, teams, context);
    remove = new RemoveMemberUseCase(teams, context);
  });

  it('creates the local user and farm link from accepted organization access', async () => {
    await expect(
      run(() =>
        assign.execute({
          globalUserId: 'member-a',
          farmId: 10,
          role: 'COLABORADOR',
          profileId: 7,
        }),
      ),
    ).resolves.toEqual({
      localUserId: 100,
      globalUserId: 'member-a',
      farmId: 10,
      role: 'COLABORADOR',
      profileId: 7,
      active: true,
    });
    expect(directory.findAccepted.mock.calls).toEqual([
      ['organization-a', 'member-a'],
    ]);
    expect(teams.users.size).toBe(1);
    expect(teams.memberships.size).toBe(1);
  });

  it('rejects a user without accepted organization access before tenant writes', async () => {
    directory.findAccepted.mockResolvedValue(null);

    await expect(
      run(() =>
        assign.execute({
          globalUserId: 'pending-member',
          farmId: 10,
          role: 'COLABORADOR',
          profileId: null,
        }),
      ),
    ).rejects.toMatchObject({ code: 'organizationAccessRequired' });
    expect(teams.transactionCount).toBe(0);
  });

  it('keeps UsuarioFazenda idempotent when assigning the same member twice', async () => {
    const command = {
      globalUserId: 'member-a',
      farmId: 10,
      role: 'COLABORADOR',
      profileId: 7,
    };

    const first = await run(() => assign.execute(command));
    const second = await run(() => assign.execute(command));

    expect(second).toEqual(first);
    expect(teams.users.size).toBe(1);
    expect(teams.memberships.size).toBe(1);
  });

  it('removes farm access through soft deactivation', async () => {
    const member = await run(() =>
      assign.execute({
        globalUserId: 'member-a',
        farmId: 10,
        role: 'COLABORADOR',
        profileId: null,
      }),
    );

    await expect(
      run(() =>
        remove.execute({ localUserId: member.localUserId, farmId: 10 }),
      ),
    ).resolves.toMatchObject({ active: false });
    expect(teams.memberships.size).toBe(1);
  });

  it.each([
    ['assignment', () => assign.execute({
      globalUserId: 'member-a',
      farmId: 99,
      role: 'COLABORADOR',
      profileId: null,
    })],
    ['removal', () => remove.execute({ localUserId: 100, farmId: 99 })],
  ])('denies %s outside accessibleFarmIds before persistence', async (_label, operation) => {
    await expect(run(operation)).rejects.toMatchObject({
      code: 'farmAccessDenied',
    });
    expect(teams.transactionCount).toBe(0);
  });
});
