import type {
  AnimalEntryType,
  AnimalSex,
  AnimalStatus,
} from '../../domain/animal';

export interface AnimalView {
  readonly id: number;
  readonly fazendaId: number;
  readonly loteId: number;
  readonly racaId: number;
  readonly pastoId: number;
  readonly clienteId: number | null;
  readonly nome: string | null;
  readonly numeroBrinco: string | null;
  readonly sexo: AnimalSex | null;
  readonly status: AnimalStatus;
  readonly tipoEntrada: AnimalEntryType;
  readonly nascimento: string | null;
  readonly dataEntrada: string;
  readonly pesoEntrada: number | null;
  readonly pesoAtual: number | null;
  readonly precoKilo: number | null;
  readonly valorCompra: number | null;
  readonly valorCustoTotal: number | null;
  readonly matriz: boolean;
  readonly castrado: boolean;
  readonly observacao: string | null;
  readonly ativo: boolean;
}

export interface AnimalPage {
  readonly data: readonly AnimalView[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface AnimalRelations {
  readonly fazendaId: number;
  readonly loteId: number;
  readonly racaId: number;
  readonly pastoId: number;
  readonly clienteId: number | null;
}

export interface CreateAnimalRecord extends AnimalRelations {
  readonly registradoPorId: number;
  readonly nome: string | null;
  readonly numeroBrinco: string | null;
  readonly sexo: AnimalSex;
  readonly status: AnimalStatus;
  readonly tipoEntrada: AnimalEntryType;
  readonly nascimento: string | null;
  readonly dataEntrada: string;
  readonly pesoEntrada: number | null;
  readonly pesoAtual: number | null;
  readonly precoKilo: number | null;
  readonly valorCompra: number | null;
  readonly valorCustoTotal: number;
  readonly matriz: boolean;
  readonly castrado: boolean;
  readonly observacao: string | null;
}

export type UpdateAnimalRecord = Partial<
  Omit<CreateAnimalRecord, 'fazendaId' | 'registradoPorId'>
>;

export interface AnimalRepository {
  list(fazendaId: number, page: number, limit: number): Promise<AnimalPage>;
  find(id: number, fazendaId: number): Promise<AnimalView | null>;
  validateRelations(relations: AnimalRelations): Promise<boolean>;
  create(input: CreateAnimalRecord): Promise<AnimalView>;
  update(
    id: number,
    fazendaId: number,
    input: UpdateAnimalRecord,
  ): Promise<AnimalView>;
  deactivate(id: number, fazendaId: number): Promise<AnimalView>;
}

export const ANIMAL_REPOSITORY = Symbol('ANIMAL_REPOSITORY');
