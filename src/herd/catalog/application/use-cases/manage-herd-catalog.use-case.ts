import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import { normalizeCatalogDescription } from '../../domain/herd-catalog';
import type {
  BatchView,
  BreedView,
  HerdCatalogRepository,
  Page,
  PageRequest,
} from '../ports/herd-catalog.repository';

interface DescriptionCommand {
  readonly description: string;
}

interface IdentifiedCommand {
  readonly id: number;
}

interface UpdateCommand extends IdentifiedCommand, DescriptionCommand {}

export class ManageHerdCatalogUseCase {
  constructor(
    private readonly repository: HerdCatalogRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  listBreeds(request: PageRequest): Promise<Page<BreedView>> {
    this.context.requireTenant();
    return this.repository.listBreeds(request);
  }

  listBatches(request: PageRequest): Promise<Page<BatchView>> {
    const { farmId } = this.context.requireTenant();
    return this.repository.listBatches(farmId, request);
  }

  async getBreed(command: IdentifiedCommand): Promise<BreedView> {
    this.context.requireTenant();
    const breed = await this.repository.findBreed(command.id);
    if (!breed?.active) {
      throw new DomainError('breedNotFound', 'Raça não encontrada.');
    }
    return breed;
  }

  async getBatch(command: IdentifiedCommand): Promise<BatchView> {
    const { farmId } = this.context.requireTenant();
    const batch = await this.repository.findBatch(command.id, farmId);
    if (!batch?.active) {
      throw new DomainError('batchNotFound', 'Lote não encontrado.');
    }
    return batch;
  }

  async createBreed(command: DescriptionCommand): Promise<BreedView> {
    this.context.requireTenant();
    return await this.repository.createBreed(
      normalizeCatalogDescription(command.description),
    );
  }

  async createBatch(command: DescriptionCommand): Promise<BatchView> {
    const { farmId } = this.context.requireTenant();
    return await this.repository.createBatch({
      farmId,
      description: normalizeCatalogDescription(command.description),
    });
  }

  async updateBreed(command: UpdateCommand): Promise<BreedView> {
    await this.getBreed(command);
    return this.repository.updateBreed(command.id, {
      description: normalizeCatalogDescription(command.description),
    });
  }

  async updateBatch(command: UpdateCommand): Promise<BatchView> {
    const { farmId } = this.context.requireTenant();
    await this.getBatch(command);
    return this.repository.updateBatch(command.id, farmId, {
      description: normalizeCatalogDescription(command.description),
    });
  }

  async deactivateBreed(command: IdentifiedCommand): Promise<BreedView> {
    await this.getBreed(command);
    if (await this.repository.hasActiveAnimalsForBreed(command.id)) {
      throw new DomainError(
        'resourceInUse',
        'A raça possui animais ativos vinculados.',
      );
    }
    return this.repository.deactivateBreed(command.id);
  }

  async deactivateBatch(command: IdentifiedCommand): Promise<BatchView> {
    const { farmId } = this.context.requireTenant();
    await this.getBatch(command);
    if (await this.repository.hasActiveAnimalsForBatch(command.id, farmId)) {
      throw new DomainError(
        'resourceInUse',
        'O lote possui animais ativos vinculados.',
      );
    }
    return this.repository.deactivateBatch(command.id, farmId);
  }
}
