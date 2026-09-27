import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import {
  ANIMAL_ENTRY_TYPES,
  ANIMAL_SEXES,
  ANIMAL_STATUSES,
  assertAnimalEnum,
  normalizeAnimalName,
  normalizeEarTag,
  type AnimalEntryType,
  type AnimalSex,
  type AnimalStatus,
} from '../../domain/animal';
import type {
  AnimalPage,
  AnimalRepository,
  AnimalView,
  CreateAnimalRecord,
  UpdateAnimalRecord,
} from '../ports/animal.repository';

export interface CreateAnimalCommand {
  readonly loteId: number;
  readonly racaId: number;
  readonly pastoId: number;
  readonly clienteId?: number | null;
  readonly nome?: string | null;
  readonly numeroBrinco?: string | null;
  readonly sexo: AnimalSex;
  readonly status?: AnimalStatus;
  readonly tipoEntrada: AnimalEntryType;
  readonly nascimento?: string | null;
  readonly dataEntrada: string;
  readonly pesoEntrada?: number | null;
  readonly precoKilo?: number | null;
  readonly valorCompra?: number | null;
  readonly valorCustoTotal?: number;
  readonly matriz?: boolean;
  readonly castrado?: boolean;
  readonly observacao?: string | null;
}

export interface UpdateAnimalCommand extends UpdateAnimalRecord {
  readonly id: number;
}

export class ManageAnimalsUseCase {
  constructor(
    private readonly repository: AnimalRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  list(input: { page: number; limit: number }): Promise<AnimalPage> {
    const { farmId } = this.context.requireTenant();
    return this.repository.list(farmId, input.page, input.limit);
  }

  async get(input: { id: number }): Promise<AnimalView> {
    const { farmId } = this.context.requireTenant();
    const animal = await this.repository.find(input.id, farmId);
    if (!animal?.ativo) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
    return animal;
  }

  async create(command: CreateAnimalCommand): Promise<AnimalView> {
    const { farmId, localUserId } = this.context.requireTenant();
    const sexo = assertAnimalEnum('sexo', command.sexo, ANIMAL_SEXES);
    const status = assertAnimalEnum(
      'status',
      command.status ?? 'ATIVO',
      ANIMAL_STATUSES,
    );
    const tipoEntrada = assertAnimalEnum(
      'tipoEntrada',
      command.tipoEntrada,
      ANIMAL_ENTRY_TYPES,
    );
    const record: CreateAnimalRecord = {
      fazendaId: farmId,
      registradoPorId: localUserId,
      loteId: command.loteId,
      racaId: command.racaId,
      pastoId: command.pastoId,
      clienteId: command.clienteId ?? null,
      nome: normalizeAnimalName(command.nome),
      numeroBrinco: normalizeEarTag(command.numeroBrinco),
      sexo,
      status,
      tipoEntrada,
      nascimento: command.nascimento ?? null,
      dataEntrada: command.dataEntrada,
      pesoEntrada: command.pesoEntrada ?? null,
      pesoAtual: command.pesoEntrada ?? null,
      precoKilo: command.precoKilo ?? null,
      valorCompra: command.valorCompra ?? null,
      valorCustoTotal: command.valorCustoTotal ?? 0,
      matriz: command.matriz ?? false,
      castrado: command.castrado ?? false,
      observacao: normalizeAnimalName(command.observacao),
    };
    await this.assertRelations(record);
    return this.repository.create(record);
  }

  async update(command: UpdateAnimalCommand): Promise<AnimalView> {
    const { farmId } = this.context.requireTenant();
    const current = await this.get({ id: command.id });
    const input: UpdateAnimalRecord = {
      ...(command.loteId !== undefined ? { loteId: command.loteId } : {}),
      ...(command.racaId !== undefined ? { racaId: command.racaId } : {}),
      ...(command.pastoId !== undefined ? { pastoId: command.pastoId } : {}),
      ...(command.clienteId !== undefined
        ? { clienteId: command.clienteId }
        : {}),
      ...(command.nome !== undefined
        ? { nome: normalizeAnimalName(command.nome) }
        : {}),
      ...(command.numeroBrinco !== undefined
        ? { numeroBrinco: normalizeEarTag(command.numeroBrinco) }
        : {}),
      ...(command.sexo !== undefined
        ? { sexo: assertAnimalEnum('sexo', command.sexo, ANIMAL_SEXES) }
        : {}),
      ...(command.pesoAtual !== undefined
        ? { pesoAtual: command.pesoAtual }
        : {}),
      ...(command.status !== undefined
        ? {
            status: assertAnimalEnum('status', command.status, ANIMAL_STATUSES),
          }
        : {}),
    };
    await this.assertRelations({ ...current, ...input, fazendaId: farmId });
    return this.repository.update(command.id, farmId, input);
  }

  async deactivate(input: { id: number }): Promise<AnimalView> {
    const { farmId } = this.context.requireTenant();
    await this.get(input);
    return this.repository.deactivate(input.id, farmId);
  }

  private async assertRelations(input: {
    fazendaId: number;
    loteId: number;
    racaId: number;
    pastoId: number;
    clienteId: number | null;
  }): Promise<void> {
    if (!(await this.repository.validateRelations(input))) {
      throw new DomainError(
        'animalRelationUnavailable',
        'Um ou mais vínculos do animal não estão disponíveis na fazenda.',
      );
    }
  }
}
