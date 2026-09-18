import type { FazendaRole } from '../../../common/rbac/rbac.enums';

export const DEFAULT_PROFILE_REPOSITORY = Symbol('DEFAULT_PROFILE_REPOSITORY');

export type DefaultProfilePermissions = Readonly<
  Partial<Record<FazendaRole, readonly number[]>>
>;

export interface DefaultProfileRepository {
  seed(profiles: DefaultProfilePermissions): Promise<void>;
}
