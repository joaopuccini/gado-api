import { AppAction, AppModule } from './rbac.config';

export interface PermissionEntry {
  readonly id: number;
  readonly code: string;
  readonly module: AppModule;
  readonly action: AppAction;
  readonly label: string;
  readonly description: string;
}

export const PERMISSIONS_CATALOG: readonly PermissionEntry[] = [
  // Dashboard
  { id: 1, code: 'dashboard:ler', module: AppModule.DASHBOARD, action: AppAction.LER, label: 'Visualizar dashboard', description: 'Visualizar indicadores e métricas principais' },

  // Animais
  { id: 2, code: 'animais:ler', module: AppModule.ANIMAIS, action: AppAction.LER, label: 'Visualizar animais', description: 'Listar e detalhar cadastro de animais' },
  { id: 3, code: 'animais:criar', module: AppModule.ANIMAIS, action: AppAction.CRIAR, label: 'Cadastrar animal', description: 'Criar novo animal ou registrar nascimento/compra' },
  { id: 4, code: 'animais:editar', module: AppModule.ANIMAIS, action: AppAction.EDITAR, label: 'Editar animal', description: 'Alterar dados cadastrais de um animal' },
  { id: 5, code: 'animais:excluir', module: AppModule.ANIMAIS, action: AppAction.EXCLUIR, label: 'Excluir animal', description: 'Remover registro de animal' },
  { id: 6, code: 'animais:gerenciar', module: AppModule.ANIMAIS, action: AppAction.GERENCIAR, label: 'Gerenciar animais', description: 'Acesso total ao módulo de animais' },

  // Pesagens
  { id: 7, code: 'pesagens:ler', module: AppModule.PESAGENS, action: AppAction.LER, label: 'Visualizar pesagens', description: 'Listar histórico de pesagens' },
  { id: 8, code: 'pesagens:criar', module: AppModule.PESAGENS, action: AppAction.CRIAR, label: 'Registrar pesagem', description: 'Registrar nova pesagem' },
  { id: 9, code: 'pesagens:gerenciar', module: AppModule.PESAGENS, action: AppAction.GERENCIAR, label: 'Gerenciar pesagens', description: 'Acesso total ao histórico de pesagens' },

  // Sanidade
  { id: 10, code: 'sanidade:ler', module: AppModule.SANIDADE, action: AppAction.LER, label: 'Visualizar sanidade', description: 'Listar histórico de protocolos sanitários e tratamentos' },
  { id: 11, code: 'sanidade:criar', module: AppModule.SANIDADE, action: AppAction.CRIAR, label: 'Registrar tratamento sanitário', description: 'Registrar novos tratamentos e aplicações' },
  { id: 12, code: 'sanidade:gerenciar', module: AppModule.SANIDADE, action: AppAction.GERENCIAR, label: 'Gerenciar sanidade', description: 'Acesso total ao módulo de sanidade' },

  // Manejo
  { id: 13, code: 'manejo:ler', module: AppModule.MANEJO, action: AppAction.LER, label: 'Visualizar manejos', description: 'Listar atividades de manejo' },
  { id: 14, code: 'manejo:criar', module: AppModule.MANEJO, action: AppAction.CRIAR, label: 'Registrar manejo', description: 'Registrar nova atividade de manejo' },
  { id: 15, code: 'manejo:gerenciar', module: AppModule.MANEJO, action: AppAction.GERENCIAR, label: 'Gerenciar manejos', description: 'Acesso total ao módulo de manejo' },

  // Financeiro
  { id: 16, code: 'financeiro:ler', module: AppModule.FINANCEIRO, action: AppAction.LER, label: 'Visualizar financeiro', description: 'Visualizar lançamentos financeiros e saldos' },
  { id: 17, code: 'financeiro:gerenciar', module: AppModule.FINANCEIRO, action: AppAction.GERENCIAR, label: 'Gerenciar financeiro', description: 'Acesso total ao módulo financeiro (lançamentos, conciliação)' },

  // Pastos
  { id: 18, code: 'pastos:ler', module: AppModule.PASTOS, action: AppAction.LER, label: 'Visualizar pastos', description: 'Listar pastos e ocupação' },
  { id: 19, code: 'pastos:gerenciar', module: AppModule.PASTOS, action: AppAction.GERENCIAR, label: 'Gerenciar pastos', description: 'Acesso total ao módulo de pastos (criar, editar, excluir)' },

  // Lotes
  { id: 20, code: 'lotes:ler', module: AppModule.LOTES, action: AppAction.LER, label: 'Visualizar lotes', description: 'Listar lotes de animais' },
  { id: 21, code: 'lotes:gerenciar', module: AppModule.LOTES, action: AppAction.GERENCIAR, label: 'Gerenciar lotes', description: 'Acesso total ao módulo de lotes (formar, desmembrar)' },

  // Raças
  { id: 22, code: 'racas:ler', module: AppModule.RACAS, action: AppAction.LER, label: 'Visualizar raças', description: 'Listar raças cadastradas' },
  { id: 23, code: 'racas:gerenciar', module: AppModule.RACAS, action: AppAction.GERENCIAR, label: 'Gerenciar raças', description: 'Acesso total ao cadastro de raças' },

  // Clientes
  { id: 24, code: 'clientes:ler', module: AppModule.CLIENTES, action: AppAction.LER, label: 'Visualizar clientes/parceiros', description: 'Listar clientes, fornecedores e parceiros' },
  { id: 25, code: 'clientes:gerenciar', module: AppModule.CLIENTES, action: AppAction.GERENCIAR, label: 'Gerenciar clientes', description: 'Acesso total ao cadastro de clientes' },

  // Fotos
  { id: 26, code: 'fotos:ler', module: AppModule.FOTOS, action: AppAction.LER, label: 'Visualizar fotos', description: 'Visualizar fotos de animais e instalações' },
  { id: 27, code: 'fotos:criar', module: AppModule.FOTOS, action: AppAction.CRIAR, label: 'Enviar fotos', description: 'Fazer upload de novas fotos' },
  { id: 28, code: 'fotos:gerenciar', module: AppModule.FOTOS, action: AppAction.GERENCIAR, label: 'Gerenciar fotos', description: 'Acesso total à galeria de fotos (excluir)' },

  // Movimentações
  { id: 29, code: 'movimentacoes:ler', module: AppModule.MOVIMENTACOES, action: AppAction.LER, label: 'Visualizar movimentações', description: 'Listar histórico de transferências e mortes' },
  { id: 30, code: 'movimentacoes:criar', module: AppModule.MOVIMENTACOES, action: AppAction.CRIAR, label: 'Registrar movimentação', description: 'Registrar transferência, nascimento ou morte' },
  { id: 31, code: 'movimentacoes:gerenciar', module: AppModule.MOVIMENTACOES, action: AppAction.GERENCIAR, label: 'Gerenciar movimentações', description: 'Acesso total às movimentações (estorno, edição)' },

  // Configurações
  { id: 32, code: 'configuracoes:ler', module: AppModule.CONFIGURACOES, action: AppAction.LER, label: 'Visualizar configurações', description: 'Acesso à leitura das configurações da fazenda' },
  { id: 33, code: 'configuracoes:gerenciar', module: AppModule.CONFIGURACOES, action: AppAction.GERENCIAR, label: 'Gerenciar configurações', description: 'Acesso total às configurações (usuários, sistema, perfis)' },
] as const;
