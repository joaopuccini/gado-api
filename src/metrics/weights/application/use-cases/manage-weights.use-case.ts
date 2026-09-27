import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import {
  normalizeWeightCorrection,
  normalizeWeightMeasurement,
} from '../../domain/weight-measurement';
import type {
  WeightListInput,
  WeightMeasurementPage,
  WeightMeasurementView,
  WeightRepository,
} from '../ports/weight.repository';

export interface RegisterWeightCommand {
  readonly animalId: number;
  readonly weight: number;
  readonly measuredAt: string;
  readonly note?: string | null;
}

export interface CorrectWeightCommand {
  readonly id: number;
  readonly weight: number;
  readonly measuredAt: string;
  readonly correctionReason: string;
  readonly note?: string | null;
}

const dateOnly = (value: string): Date => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new DomainError('validationFailed', 'Data da pesagem inválida.', [
      { field: 'measuredAt', reason: 'invalidDate' },
    ]);
  }
  return parsed;
};

export class ManageWeightsUseCase {
  constructor(
    private readonly repository: WeightRepository,
    private readonly context: ExecutionContextStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(input: WeightListInput): Promise<WeightMeasurementPage> {
    const { farmId } = this.context.requireTenant();
    return this.repository.list(farmId, input);
  }

  async get(input: { id: number }): Promise<WeightMeasurementView> {
    const { farmId } = this.context.requireTenant();
    const measurement = await this.repository.find(input.id, farmId);
    if (!measurement) {
      throw new DomainError('resourceNotFound', 'Pesagem não encontrada.');
    }
    return measurement;
  }

  async register(
    command: RegisterWeightCommand,
  ): Promise<WeightMeasurementView> {
    const { farmId, localUserId } = this.context.requireTenant();
    const animal = await this.requireAnimal(command.animalId, farmId);
    const normalized = normalizeWeightMeasurement({
      weight: command.weight,
      measuredAt: dateOnly(command.measuredAt),
      animalEntryDate: animal.entryDate,
      note: command.note,
      today: this.now(),
    });

    return this.repository.create({
      farmId,
      animalId: animal.id,
      registeredById: localUserId,
      ...normalized,
    });
  }

  async correct(command: CorrectWeightCommand): Promise<WeightMeasurementView> {
    const { farmId, localUserId } = this.context.requireTenant();
    const previous = await this.repository.find(command.id, farmId);
    if (!previous) {
      throw new DomainError('resourceNotFound', 'Pesagem não encontrada.');
    }
    if (!previous.active) {
      throw new DomainError(
        'conflict',
        'A pesagem já foi corrigida por outra operação.',
      );
    }

    const animal = await this.requireAnimal(previous.animalId, farmId);
    const normalized = normalizeWeightCorrection({
      weight: command.weight,
      measuredAt: dateOnly(command.measuredAt),
      animalEntryDate: animal.entryDate,
      note: command.note,
      today: this.now(),
      correctsMeasurementId: String(previous.id),
      correctionReason: command.correctionReason,
    });

    return this.repository.correct({
      farmId,
      animalId: animal.id,
      registeredById: localUserId,
      previousMeasurementId: previous.id,
      weight: normalized.weight,
      measuredAt: normalized.measuredAt,
      note: normalized.note,
      correctionReason: normalized.correctionReason,
    });
  }

  private async requireAnimal(animalId: number, farmId: number) {
    const animal = await this.repository.findAnimal(animalId, farmId);
    if (!animal?.active) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
    return animal;
  }
}
