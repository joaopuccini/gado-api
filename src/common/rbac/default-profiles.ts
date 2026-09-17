import { FazendaRole } from './rbac.enums';
import { PERMISSIONS_CATALOG } from './permissions-catalog';

export const DEFAULT_PROFILE_PERMISSIONS: Record<FazendaRole, number[]> = {
  [FazendaRole.DONO]: PERMISSIONS_CATALOG.map((p) => p.id),

  [FazendaRole.GESTOR]: [
    1, // dashboard:ler
    6, // animais:gerenciar
    9, // pesagens:gerenciar
    12, // sanidade:gerenciar
    15, // manejo:gerenciar
    17, // financeiro:gerenciar
    19, // pastos:gerenciar
    21, // lotes:gerenciar
    23, // racas:gerenciar
    25, // clientes:gerenciar
    28, // fotos:gerenciar
    31, // movimentacoes:gerenciar
    32, // configuracoes:ler
  ],

  [FazendaRole.COLABORADOR]: [
    1, // dashboard:ler
    2, 3, 4, // animais:ler, criar, editar
    7, 8, // pesagens:ler, criar
    10, 11, // sanidade:ler, criar
    13, 14, // manejo:ler, criar
    18, // pastos:ler
    20, // lotes:ler
    22, // racas:ler
    26, 27, // fotos:ler, criar
    29, 30, // movimentacoes:ler, criar
  ],

  [FazendaRole.VETERINARIO]: [
    1, // dashboard:ler
    2, // animais:ler
    7, 8, // pesagens:ler, criar
    12, // sanidade:gerenciar
    15, // manejo:gerenciar
    26, 27, // fotos:ler, criar
  ],

  [FazendaRole.CONSULTOR]: [
    1, // dashboard:ler
    2, // animais:ler
    7, // pesagens:ler
    10, // sanidade:ler
    13, // manejo:ler
    16, // financeiro:ler
    18, // pastos:ler
    20, // lotes:ler
    22, // racas:ler
    24, // clientes:ler
    26, // fotos:ler
    29, // movimentacoes:ler
  ],
};
