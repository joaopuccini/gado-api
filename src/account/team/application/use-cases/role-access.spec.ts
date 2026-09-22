import { AccountRoleAccessPolicy } from './account-role-access.policy';

type AccountCapability =
  | 'farm.read'
  | 'farm.write'
  | 'team.manage'
  | 'profile.manage'
  | 'subscription.read';

interface RoleCase {
  readonly role: 'DONO' | 'GESTOR' | 'COLABORADOR' | 'CONSULTOR';
  readonly allowed: readonly AccountCapability[];
  readonly denied: readonly AccountCapability[];
}

describe('account role access matrix', () => {
  const policy = new AccountRoleAccessPolicy();
  const cases: readonly RoleCase[] = [
    {
      role: 'DONO',
      allowed: [
        'farm.read',
        'farm.write',
        'team.manage',
        'profile.manage',
        'subscription.read',
      ],
      denied: [],
    },
    {
      role: 'GESTOR',
      allowed: ['farm.read', 'farm.write', 'team.manage', 'subscription.read'],
      denied: ['profile.manage'],
    },
    {
      role: 'COLABORADOR',
      allowed: ['farm.read', 'farm.write'],
      denied: ['team.manage', 'profile.manage', 'subscription.read'],
    },
    {
      role: 'CONSULTOR',
      allowed: ['farm.read'],
      denied: [
        'farm.write',
        'team.manage',
        'profile.manage',
        'subscription.read',
      ],
    },
  ];

  it.each(cases)('allows only the declared capabilities for $role', (entry) => {
    for (const capability of entry.allowed) {
      expect(policy.can(entry.role, capability)).toBe(true);
      expect(() => policy.assert(entry.role, capability)).not.toThrow();
    }

    for (const capability of entry.denied) {
      expect(policy.can(entry.role, capability)).toBe(false);
      expect(() => policy.assert(entry.role, capability)).toThrow(
        expect.objectContaining({ code: 'forbidden' }),
      );
    }
  });

  it('fails closed for an unknown role or capability', () => {
    expect(policy.can('UNKNOWN', 'farm.read')).toBe(false);
    expect(policy.can('DONO', 'unknown.capability')).toBe(false);
  });
});
