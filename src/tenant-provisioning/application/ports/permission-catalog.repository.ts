import type { PermissionEntry } from '../../../common/rbac/permissions-catalog';

export const PERMISSION_CATALOG_REPOSITORY = Symbol(
  'PERMISSION_CATALOG_REPOSITORY',
);

export interface PermissionCatalogRepository {
  sync(entries: readonly PermissionEntry[]): Promise<void>;
}
