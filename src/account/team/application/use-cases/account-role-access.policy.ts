import { DomainError } from '../../../../common/errors/domain-error';

export type AccountCapability =
  | 'farm.read'
  | 'farm.write'
  | 'team.manage'
  | 'profile.manage'
  | 'subscription.read';

const capabilitiesByRole: Readonly<
  Record<string, readonly AccountCapability[]>
> = {
  DONO: [
    'farm.read',
    'farm.write',
    'team.manage',
    'profile.manage',
    'subscription.read',
  ],
  GESTOR: ['farm.read', 'farm.write', 'team.manage', 'subscription.read'],
  COLABORADOR: ['farm.read', 'farm.write'],
  CONSULTOR: ['farm.read'],
};

export class AccountRoleAccessPolicy {
  can(role: string, capability: string): boolean {
    return (capabilitiesByRole[role] ?? []).includes(
      capability as AccountCapability,
    );
  }

  assert(role: string, capability: string): void {
    if (!this.can(role, capability)) {
      throw new DomainError('forbidden', 'Acesso negado');
    }
  }
}
