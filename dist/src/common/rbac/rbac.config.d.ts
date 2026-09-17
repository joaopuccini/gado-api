import { AppAction, AppModule, FazendaRole, PermissionString } from './rbac.enums';
export { AppAction, AppModule, FazendaRole, type PermissionString } from './rbac.enums';
export declare const RolePermissions: Record<FazendaRole, PermissionString[]>;
export declare function hasPermission(role: FazendaRole, module: AppModule, action: AppAction): boolean;
export declare function getPermissionsForRole(role: FazendaRole): PermissionString[];
