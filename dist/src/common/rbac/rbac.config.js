"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = exports.FazendaRole = exports.AppAction = exports.AppModule = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
var AppModule;
(function (AppModule) {
    AppModule["DASHBOARD"] = "dashboard";
    AppModule["ANIMAIS"] = "animais";
    AppModule["PESAGENS"] = "pesagens";
    AppModule["SANIDADE"] = "sanidade";
    AppModule["MANEJO"] = "manejo";
    AppModule["FINANCEIRO"] = "financeiro";
    AppModule["PASTOS"] = "pastos";
    AppModule["LOTES"] = "lotes";
    AppModule["RACAS"] = "racas";
    AppModule["CLIENTES"] = "clientes";
    AppModule["FOTOS"] = "fotos";
    AppModule["MOVIMENTACOES"] = "movimentacoes";
    AppModule["CONFIGURACOES"] = "configuracoes";
})(AppModule || (exports.AppModule = AppModule = {}));
var AppAction;
(function (AppAction) {
    AppAction["LER"] = "ler";
    AppAction["CRIAR"] = "criar";
    AppAction["EDITAR"] = "editar";
    AppAction["EXCLUIR"] = "excluir";
    AppAction["GERENCIAR"] = "gerenciar";
})(AppAction || (exports.AppAction = AppAction = {}));
var FazendaRole;
(function (FazendaRole) {
    FazendaRole["DONO"] = "DONO";
    FazendaRole["GESTOR"] = "GESTOR";
    FazendaRole["COLABORADOR"] = "COLABORADOR";
    FazendaRole["VETERINARIO"] = "VETERINARIO";
    FazendaRole["CONSULTOR"] = "CONSULTOR";
})(FazendaRole || (exports.FazendaRole = FazendaRole = {}));
exports.RolePermissions = {
    [FazendaRole.DONO]: [
        'dashboard:ler',
        'animais:gerenciar',
        'pesagens:gerenciar',
        'sanidade:gerenciar',
        'manejo:gerenciar',
        'financeiro:gerenciar',
        'pastos:gerenciar',
        'lotes:gerenciar',
        'racas:gerenciar',
        'clientes:gerenciar',
        'fotos:gerenciar',
        'movimentacoes:gerenciar',
        'configuracoes:gerenciar',
    ],
    [FazendaRole.GESTOR]: [
        'dashboard:ler',
        'animais:gerenciar',
        'pesagens:gerenciar',
        'sanidade:gerenciar',
        'manejo:gerenciar',
        'financeiro:gerenciar',
        'pastos:gerenciar',
        'lotes:gerenciar',
        'racas:gerenciar',
        'clientes:gerenciar',
        'fotos:gerenciar',
        'movimentacoes:gerenciar',
        'configuracoes:ler',
    ],
    [FazendaRole.COLABORADOR]: [
        'dashboard:ler',
        'animais:ler', 'animais:criar', 'animais:editar',
        'pesagens:ler', 'pesagens:criar',
        'sanidade:ler', 'sanidade:criar',
        'manejo:ler', 'manejo:criar',
        'pastos:ler',
        'lotes:ler',
        'racas:ler',
        'fotos:ler', 'fotos:criar',
        'movimentacoes:ler', 'movimentacoes:criar',
    ],
    [FazendaRole.VETERINARIO]: [
        'dashboard:ler',
        'animais:ler',
        'pesagens:ler', 'pesagens:criar',
        'sanidade:gerenciar',
        'manejo:gerenciar',
        'fotos:ler', 'fotos:criar',
    ],
    [FazendaRole.CONSULTOR]: [
        'dashboard:ler',
        'animais:ler',
        'pesagens:ler',
        'sanidade:ler',
        'manejo:ler',
        'financeiro:ler',
        'pastos:ler',
        'lotes:ler',
        'racas:ler',
        'clientes:ler',
        'fotos:ler',
        'movimentacoes:ler',
    ],
};
function hasPermission(role, module, action) {
    if (role === FazendaRole.DONO)
        return true;
    const permissions = exports.RolePermissions[role] || [];
    const required = `${module}:${action}`;
    const manageAll = `${module}:${AppAction.GERENCIAR}`;
    return permissions.includes(required) || permissions.includes(manageAll);
}
function getPermissionsForRole(role) {
    if (role === FazendaRole.DONO) {
        return Object.values(AppModule).flatMap((mod) => Object.values(AppAction).map((act) => `${mod}:${act}`));
    }
    return exports.RolePermissions[role] || [];
}
//# sourceMappingURL=rbac.config.js.map