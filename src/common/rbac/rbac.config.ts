// ==========================================
// RBAC — Single Source of Truth
// Compartilhado entre Backend (Guards) e Frontend (Menus)
// ==========================================

import { DEFAULT_PROFILE_PERMISSIONS } from './default-profiles';
import { PERMISSIONS_CATALOG } from './permissions-catalog';


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
 * Matriz de permissões por role da fazenda derivada do catálogo.
 * DONO não precisa de lista — tem acesso total (bypass no hasPermission).
 */
export const RolePermissions: Record<FazendaRole, PermissionString[]> = Object.entries(
  DEFAULT_PROFILE_PERMISSIONS,
).reduce(
  (acc, [role, permissionIds]) => {
    acc[role as FazendaRole] = permissionIds
      .map((id) => PERMISSIONS_CATALOG.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .map((p) => `${p.module}:${p.action}` as PermissionString);
    return acc;
  },
  {} as Record<FazendaRole, PermissionString[]>,
);

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
