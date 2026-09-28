import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import {
  assertDifferentLocation,
  normalizeMovementDate,
  normalizeMovementNotes,
} from '../../domain/animal-movement';
import type {
  AnimalMovementView,
  MovementHistoryPage,
  MovementHistoryRequest,
  MovementUnitOfWork,
} from '../ports/movement.unit-of-work';

interface BaseMovementCommand {
  readonly animalId: number;
  readonly movementDate: string;
  readonly notes?: string | null;
}

export interface PastureMovementCommand extends BaseMovementCommand {
  readonly destinationPastureId: number;
}

export interface BatchMovementCommand extends BaseMovementCommand {
  readonly destinationBatchId: number;
}

export class MoveAnimalUseCase {
  constructor(
    private readonly unitOfWork: MovementUnitOfWork,
    private readonly context: ExecutionContextStore,
  ) {}

  async toPasture(
    command: PastureMovementCommand,
  ): Promise<AnimalMovementView> {
    const context = this.requireAuthorized('movimentacoes:criar');
    const location = await this.requireLocation(
      command.animalId,
      context.farmId,
    );
    assertDifferentLocation(
      'destinationPastureId',
      location.pastureId,
      command.destinationPastureId,
    );
    return this.unitOfWork.moveAtomically({
      kind: 'pasture',
      farmId: context.farmId,
      animalId: location.animalId,
      originId: location.pastureId,
      destinationId: command.destinationPastureId,
      registeredById: context.localUserId,
      movementDate: normalizeMovementDate(command.movementDate),
      notes: normalizeMovementNotes(command.notes),
    });
  }

  async toBatch(command: BatchMovementCommand): Promise<AnimalMovementView> {
    const context = this.requireAuthorized('movimentacoes:criar');
    const location = await this.requireLocation(
      command.animalId,
      context.farmId,
    );
    assertDifferentLocation(
      'destinationBatchId',
      location.batchId,
      command.destinationBatchId,
    );
    return this.unitOfWork.moveAtomically({
      kind: 'batch',
      farmId: context.farmId,
      animalId: location.animalId,
      originId: location.batchId,
      destinationId: command.destinationBatchId,
      registeredById: context.localUserId,
      movementDate: normalizeMovementDate(command.movementDate),
      notes: normalizeMovementNotes(command.notes),
    });
  }

  history(request: MovementHistoryRequest): Promise<MovementHistoryPage> {
    const { farmId } = this.requireAuthorized('movimentacoes:ler');
    return this.unitOfWork.listHistory(farmId, request);
  }

  private async requireLocation(animalId: number, farmId: number) {
    const location = await this.unitOfWork.findAnimalLocation(animalId, farmId);
    if (!location?.active) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
    return location;
  }

  private requireAuthorized(permission: string) {
    const context = this.context.requireTenant();
    if (!context.accessibleFarmIds.includes(context.farmId)) {
      throw new DomainError('farmAccessDenied', 'Acesso à fazenda negado.');
    }
    if (!context.permissions.includes(permission)) {
      throw new DomainError('forbidden', 'Permissão insuficiente.');
    }
    return context;
  }
}
