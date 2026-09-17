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
