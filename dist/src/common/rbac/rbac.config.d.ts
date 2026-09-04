export declare enum AppModule {
    DASHBOARD = "dashboard",
    ANIMAIS = "animais",
    PESAGENS = "pesagens",
    SANIDADE = "sanidade",
    MANEJO = "manejo",
    FINANCEIRO = "financeiro",
    PASTOS = "pastos",
    LOTES = "lotes",
    RACAS = "racas",
    CLIENTES = "clientes",
    FOTOS = "fotos",
    MOVIMENTACOES = "movimentacoes",
    CONFIGURACOES = "configuracoes"
}
export declare enum AppAction {
    LER = "ler",
    CRIAR = "criar",
    EDITAR = "editar",
    EXCLUIR = "excluir",
    GERENCIAR = "gerenciar"
}
export declare enum FazendaRole {
    DONO = "DONO",
    GESTOR = "GESTOR",
    COLABORADOR = "COLABORADOR",
    VETERINARIO = "VETERINARIO",
    CONSULTOR = "CONSULTOR"
}
export type PermissionString = `${AppModule}:${AppAction}`;
export declare const RolePermissions: Record<FazendaRole, PermissionString[]>;
export declare function hasPermission(role: FazendaRole, module: AppModule, action: AppAction): boolean;
export declare function getPermissionsForRole(role: FazendaRole): PermissionString[];
