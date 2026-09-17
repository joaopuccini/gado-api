"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = exports.FazendaRole = exports.AppModule = exports.AppAction = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
const default_profiles_1 = require("./default-profiles");
const permissions_catalog_1 = require("./permissions-catalog");
const rbac_enums_1 = require("./rbac.enums");
var rbac_enums_2 = require("./rbac.enums");
Object.defineProperty(exports, "AppAction", { enumerable: true, get: function () { return rbac_enums_2.AppAction; } });
Object.defineProperty(exports, "AppModule", { enumerable: true, get: function () { return rbac_enums_2.AppModule; } });
Object.defineProperty(exports, "FazendaRole", { enumerable: true, get: function () { return rbac_enums_2.FazendaRole; } });
exports.RolePermissions = Object.entries(default_profiles_1.DEFAULT_PROFILE_PERMISSIONS).reduce((acc, [role, permissionIds]) => {
    acc[role] = permissionIds
        .map((id) => permissions_catalog_1.PERMISSIONS_CATALOG.find((p) => p.id === id))
        .filter((p) => p !== undefined)
        .map((p) => `${p.module}:${p.action}`);
    return acc;
}, {});
function hasPermission(role, module, action) {
    if (role === rbac_enums_1.FazendaRole.DONO)
        return true;
    const permissions = exports.RolePermissions[role] || [];
    const required = `${module}:${action}`;
    const manageAll = `${module}:${rbac_enums_1.AppAction.GERENCIAR}`;
    return permissions.includes(required) || permissions.includes(manageAll);
}
function getPermissionsForRole(role) {
    if (role === rbac_enums_1.FazendaRole.DONO) {
        return Object.values(rbac_enums_1.AppModule).flatMap((mod) => Object.values(rbac_enums_1.AppAction).map((act) => `${mod}:${act}`));
    }
    return exports.RolePermissions[role] || [];
}
//# sourceMappingURL=rbac.config.js.map