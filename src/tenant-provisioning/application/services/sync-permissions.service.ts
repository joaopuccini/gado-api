import { PERMISSIONS_CATALOG } from '../../../common/rbac/permissions-catalog';
import type { PermissionCatalogRepository } from '../ports/permission-catalog.repository';

export class SyncPermissionsService {
  constructor(private readonly repository: PermissionCatalogRepository) {}

  async execute(): Promise<void> {
    await this.repository.sync(PERMISSIONS_CATALOG);
  }
}
