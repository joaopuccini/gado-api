import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import {
  normalizeAreaHectares,
  normalizePastureDescription,
  normalizePastureGeoJson,
} from '../../domain/pasture';
import type {
  Page,
  PageRequest,
  PastureRepository,
  PastureView,
} from '../ports/pasture.repository';

interface PastureCommand {
  readonly description: string;
  readonly geoJson: unknown;
  readonly areaHectares?: string;
}

interface IdentifiedCommand {
  readonly id: number;
}

export class ManagePasturesUseCase {
  constructor(
    private readonly repository: PastureRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async list(request: PageRequest): Promise<Page<PastureView>> {
    const { farmId } = this.context.requireTenant();
    return await this.repository.list(farmId, request);
  }

  async get(command: IdentifiedCommand): Promise<PastureView> {
    const { farmId } = this.context.requireTenant();
    const pasture = await this.repository.findById(command.id, farmId);
    if (!pasture?.active) {
      throw new DomainError('pastureNotFound', 'Pasto não encontrado.');
    }
    return pasture;
  }

  async create(command: PastureCommand): Promise<PastureView> {
    const { farmId } = this.context.requireTenant();
    return await this.repository.create({
      farmId,
      ...this.normalize(command),
    });
  }

  async update(
    command: IdentifiedCommand & PastureCommand,
  ): Promise<PastureView> {
    const { farmId } = this.context.requireTenant();
    await this.get(command);
    return this.repository.update(command.id, farmId, this.normalize(command));
  }

  async deactivate(command: IdentifiedCommand): Promise<PastureView> {
    const { farmId } = this.context.requireTenant();
    await this.get(command);
    if (
      (await this.repository.hasActiveAnimals(command.id, farmId)) ||
      (await this.repository.hasMovementHistory(command.id, farmId))
    ) {
      throw new DomainError(
        'resourceInUse',
        'O pasto possui animais ou histórico de movimentação.',
      );
    }
    return this.repository.deactivate(command.id, farmId);
  }

  private normalize(command: PastureCommand) {
    return {
      description: normalizePastureDescription(command.description),
      geoJson: normalizePastureGeoJson(command.geoJson),
      areaHectares: normalizeAreaHectares(command.areaHectares),
    };
  }
}
