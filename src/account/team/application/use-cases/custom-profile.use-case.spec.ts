import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../../common/context';
import { CreateProfileUseCase } from './create-profile.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';

interface ProfileView {
  readonly id: number;
  readonly farmId: number;
  readonly name: string;
  readonly description: string | null;
  readonly systemRole: string | null;
  readonly active: boolean;
  readonly permissionIds: readonly number[];
}

interface ProfileRepository {
  findActiveRole(localUserId: number, farmId: number): Promise<string | null>;
  findByName(farmId: number, name: string): Promise<ProfileView | null>;
  findById(farmId: number, profileId: number): Promise<ProfileView | null>;
  findActivePermissionIds(ids: readonly number[]): Promise<readonly number[]>;
  create(input: {
    farmId: number;
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }): Promise<ProfileView>;
  update(
    profileId: number,
    input: {
      name: string;
      description: string | null;
      permissionIds: readonly number[];
    },
  ): Promise<ProfileView>;
}

class MemoryProfileRepository implements ProfileRepository {
  role: string | null = 'DONO';
  readonly activePermissionIds = new Set([1, 2, 3]);
  readonly profiles = new Map<number, ProfileView>([
    [
      1,
      {
        id: 1,
        farmId: 10,
        name: 'Proprietário',
        description: null,
        systemRole: 'DONO',
        active: true,
        permissionIds: [1, 2, 3],
      },
    ],
  ]);
  writeCount = 0;

  findActiveRole(): Promise<string | null> {
    return Promise.resolve(this.role);
  }

  findByName(farmId: number, name: string): Promise<ProfileView | null> {
    return Promise.resolve(
      [...this.profiles.values()].find(
        (profile) =>
          profile.farmId === farmId &&
          profile.active &&
          profile.name.toLowerCase() === name.toLowerCase(),
      ) ?? null,
    );
  }

  findById(farmId: number, profileId: number): Promise<ProfileView | null> {
    const profile = this.profiles.get(profileId);
    return Promise.resolve(profile?.farmId === farmId ? profile : null);
  }

  findActivePermissionIds(ids: readonly number[]): Promise<readonly number[]> {
    return Promise.resolve(
      ids.filter((id) => this.activePermissionIds.has(id)),
    );
  }

  create(input: {
    farmId: number;
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }): Promise<ProfileView> {
    this.writeCount += 1;
    const profile: ProfileView = {
      id: this.profiles.size + 1,
      ...input,
      systemRole: null,
      active: true,
    };
    this.profiles.set(profile.id, profile);
    return Promise.resolve(profile);
  }

  update(
    profileId: number,
    input: {
      name: string;
      description: string | null;
      permissionIds: readonly number[];
    },
  ): Promise<ProfileView> {
    this.writeCount += 1;
    const current = this.profiles.get(profileId);
    if (!current) throw new Error('test fixture profile missing');
    const profile = { ...current, ...input };
    this.profiles.set(profileId, profile);
    return Promise.resolve(profile);
  }
}

const CONTEXT: ExecutionContextData = {
  requestId: 'request-profiles',
  traceId: 'trace-profiles',
  contextType: 'tenant',
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: 'owner-a',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['profiles:manage'],
};

describe('custom farm profiles', () => {
  let context: ExecutionContextStore;
  let profiles: MemoryProfileRepository;
  let create: CreateProfileUseCase;
  let update: UpdateProfileUseCase;

  const run = <T>(callback: () => Promise<T>) => context.run(CONTEXT, callback);

  beforeEach(() => {
    context = new ExecutionContextStore();
    profiles = new MemoryProfileRepository();
    create = new CreateProfileUseCase(profiles, context);
    update = new UpdateProfileUseCase(profiles, context);
  });

  it('allows the owner to create a farm-scoped profile with active permissions', async () => {
    await expect(
      run(() =>
        create.execute({
          name: '  Vaqueiro ',
          description: 'Operação diária',
          permissionIds: [2, 3],
        }),
      ),
    ).resolves.toEqual({
      id: 2,
      farmId: 10,
      name: 'Vaqueiro',
      description: 'Operação diária',
      systemRole: null,
      active: true,
      permissionIds: [2, 3],
    });
  });

  it.each(['GESTOR', 'COLABORADOR', 'CONSULTOR', null])(
    'denies profile management for role %s',
    async (role) => {
      profiles.role = role;

      await expect(
        run(() =>
          create.execute({
            name: 'Vaqueiro',
            description: null,
            permissionIds: [2],
          }),
        ),
      ).rejects.toMatchObject({ code: 'profileOwnerRequired' });
      expect(profiles.writeCount).toBe(0);
    },
  );

  it('rejects an empty custom profile', async () => {
    await expect(
      run(() =>
        create.execute({
          name: 'Sem acesso',
          description: null,
          permissionIds: [],
        }),
      ),
    ).rejects.toMatchObject({ code: 'emptyCustomProfile' });
  });

  it('rejects inactive or unknown permission IDs', async () => {
    await expect(
      run(() =>
        create.execute({
          name: 'Inválido',
          description: null,
          permissionIds: [2, 99],
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalidPermissionSelection' });
    expect(profiles.writeCount).toBe(0);
  });

  it('rejects duplicate profile names within the selected farm', async () => {
    await run(() =>
      create.execute({
        name: 'Vaqueiro',
        description: null,
        permissionIds: [2],
      }),
    );

    await expect(
      run(() =>
        create.execute({
          name: 'vaqueiro',
          description: null,
          permissionIds: [3],
        }),
      ),
    ).rejects.toMatchObject({ code: 'profileNameAlreadyExists' });
  });

  it('updates a custom profile and replaces its permission set', async () => {
    const created = await run(() =>
      create.execute({
        name: 'Vaqueiro',
        description: null,
        permissionIds: [2],
      }),
    );

    await expect(
      run(() =>
        update.execute({
          profileId: created.id,
          name: 'Vaqueiro líder',
          description: 'Equipe de campo',
          permissionIds: [2, 3],
        }),
      ),
    ).resolves.toMatchObject({
      name: 'Vaqueiro líder',
      permissionIds: [2, 3],
    });
  });

  it('keeps system profiles immutable', async () => {
    await expect(
      run(() =>
        update.execute({
          profileId: 1,
          name: 'Novo proprietário',
          description: null,
          permissionIds: [1],
        }),
      ),
    ).rejects.toMatchObject({ code: 'systemProfileImmutable' });
    expect(profiles.writeCount).toBe(0);
  });
});
