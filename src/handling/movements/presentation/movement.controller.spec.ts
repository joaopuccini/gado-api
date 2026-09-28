import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { MoveAnimalUseCase } from '../application/use-cases/move-animal.use-case';
import {
  BatchMovementDto,
  MovementHistoryQueryDto,
  PastureMovementDto,
} from './dto/movement.dto';
import { MovementController } from './movement.controller';

describe('movement HTTP boundary', () => {
  it('validates strict camelCase movement DTOs', async () => {
    const pasture = plainToInstance(PastureMovementDto, {
      animalId: 5,
      destinationPastureId: 8,
      movementDate: '2026-09-28',
      notes: ' Rotação ',
    });
    await expect(validate(pasture)).resolves.toEqual([]);
    expect(pasture.notes).toBe('Rotação');
    await expect(
      validate(
        plainToInstance(PastureMovementDto, {
          animalId: 5,
          destinationPastureId: 8,
          originPastureId: 3,
          movementDate: '2026-09-28',
        }),
        { whitelist: true, forbidNonWhitelisted: true },
      ),
    ).resolves.not.toEqual([]);
    await expect(
      validate(
        plainToInstance(BatchMovementDto, {
          animalId: 5,
          destinationBatchId: 9,
          movementDate: 'not-a-date',
        }),
      ),
    ).resolves.not.toEqual([]);
  });

  it.each([
    ['toPasture', ['movimentacoes:criar']],
    ['toBatch', ['movimentacoes:criar']],
    ['history', ['movimentacoes:ler']],
  ] as const)(
    '%s declares canonical guards and permission',
    (method, value) => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_KEY,
          MovementController.prototype[method],
        ),
      ).toEqual(value);
      expect(Reflect.getMetadata(GUARDS_METADATA, MovementController)).toEqual([
        JwtAuthGuard,
        PermissionsGuard,
      ]);
    },
  );

  it('delegates transport values without deriving tenant, farm, actor or origin', async () => {
    const useCase = {
      toPasture: jest.fn().mockResolvedValue({ id: 11 }),
      toBatch: jest.fn().mockResolvedValue({ id: 12 }),
      history: jest.fn().mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      }),
    };
    const controller = new MovementController(
      useCase as unknown as MoveAnimalUseCase,
    );
    const pasture = {
      animalId: 5,
      destinationPastureId: 8,
      movementDate: '2026-09-28',
    };
    const batch = {
      animalId: 5,
      destinationBatchId: 9,
      movementDate: '2026-09-28',
    };
    const query: MovementHistoryQueryDto = {
      animalId: 5,
      page: 1,
      pageSize: 20,
    };

    await controller.toPasture(pasture);
    await controller.toBatch(batch);
    await controller.history(query);
    expect(useCase.toPasture).toHaveBeenCalledWith(pasture);
    expect(useCase.toBatch).toHaveBeenCalledWith(batch);
    expect(useCase.history).toHaveBeenCalledWith(query);
  });
});
