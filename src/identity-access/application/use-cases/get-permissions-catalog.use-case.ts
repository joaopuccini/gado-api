import {
  PERMISSIONS_CATALOG,
  type PermissionEntry,
} from '../../../common/rbac/permissions-catalog';
import { AppModule } from '../../../common/rbac/rbac.enums';

export interface GetPermissionsCatalogResult {
  readonly data: Partial<Record<AppModule, PermissionEntry[]>>;
}

export class GetPermissionsCatalogUseCase {
  execute(): GetPermissionsCatalogResult {
    const data: Partial<Record<AppModule, PermissionEntry[]>> = {};

    for (const permission of PERMISSIONS_CATALOG) {
      const modulePermissions = data[permission.module] ?? [];
      modulePermissions.push(permission);
      data[permission.module] = modulePermissions;
    }

    return { data };
  }
}
