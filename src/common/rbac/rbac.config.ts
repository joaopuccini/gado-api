// ==========================================
// RBAC — Single Source of Truth
// Compartilhado entre Backend (Guards) e Frontend (Menus)
// ==========================================

export enum AppModule {
  DASHBOARD = 'dashboard',
  ANIMAIS = 'animais',
  PESAGENS = 'pesagens',
  SANIDADE = 'sanidade',
  MANEJO = 'manejo',
  FINANCEIRO = 'financeiro',
  PASTOS = 'pastos',
  LOTES = 'lotes',
  RACAS = 'racas',
  CLIENTES = 'clientes',
  FOTOS = 'fotos',
  MOVIMENTACOES = 'movimentacoes',
  CONFIGURACOES = 'configuracoes',
}

export enum AppAction {
  LER = 'ler',
  CRIAR = 'criar',
  EDITAR = 'editar',
  EXCLUIR = 'excluir',
  GERENCIAR = 'gerenciar',
}

export enum FazendaRole {
  DONO = 'DONO',
  GESTOR = 'GESTOR',
  COLABORADOR = 'COLABORADOR',
  VETERINARIO = 'VETERINARIO',
  CONSULTOR = 'CONSULTOR',
}

export type PermissionString = `${AppModule}:${AppAction}`;

/**
 * Matriz de permissões por role da fazenda.
 * DONO não precisa de lista — tem acesso total (bypass no hasPermission).
 */
export const RolePermissions: Record<FazendaRole, PermissionString[]> = {
  [FazendaRole.DONO]: [
    // Acesso total — listado para documentação e UI
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

/**
 * Verifica se um role tem permissão específica.
 * DONO sempre retorna true (acesso total).
 */
export function hasPermission(
  role: FazendaRole,
  module: AppModule,
  action: AppAction,
): boolean {
  if (role === FazendaRole.DONO) return true;

  const permissions = RolePermissions[role] || [];
  const required: PermissionString = `${module}:${action}`;
  const manageAll: PermissionString = `${module}:${AppAction.GERENCIAR}`;

  return permissions.includes(required) || permissions.includes(manageAll);
}

/**
 * Retorna todas as permissões de um role como strings.
 * Útil para popular o JWT payload.
 */
export function getPermissionsForRole(role: FazendaRole): PermissionString[] {
  if (role === FazendaRole.DONO) {
    // Gera todas as permissões possíveis
    return Object.values(AppModule).flatMap((mod) =>
      Object.values(AppAction).map((act) => `${mod}:${act}` as PermissionString),
    );
  }
  return RolePermissions[role] || [];
}
