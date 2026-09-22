import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { ProfileRepository } from '../ports/team.repository';

export const requireProfileOwner = async (
  teams: ProfileRepository,
  context: ExecutionContextStore,
) => {
  const tenant = context.requireTenant();
  const role = await teams.findActiveRole(tenant.localUserId, tenant.farmId);
  if (role !== 'DONO') {
    throw new DomainError(
      'profileOwnerRequired',
      'Apenas o proprietário pode gerenciar perfis',
    );
  }
  return tenant;
};

export const validatePermissionSelection = async (
  teams: ProfileRepository,
  permissionIds: readonly number[],
): Promise<readonly number[]> => {
  const uniqueIds = [...new Set(permissionIds)];
  if (uniqueIds.length === 0) {
    throw new DomainError(
      'emptyCustomProfile',
      'Perfil customizado deve possuir permissões',
    );
  }
  const activeIds = await teams.findActivePermissionIds(uniqueIds);
  if (activeIds.length !== uniqueIds.length) {
    throw new DomainError(
      'invalidPermissionSelection',
      'Seleção de permissões inválida',
    );
  }
  return uniqueIds;
};
