import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { ManageHerdCatalogUseCase } from '../application/use-cases/manage-herd-catalog.use-case';
import { BatchesController, BreedsController } from './herd-catalog.controller';
import { CatalogDescriptionDto } from './dto/herd-catalog.dto';

describe('herd catalog HTTP boundary', () => {
  it('validates and trims catalog descriptions', async () => {
    const dto = plainToInstance(CatalogDescriptionDto, {
      description: '  Nelore  ',
    });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.description).toBe('Nelore');
    await expect(
      validate(plainToInstance(CatalogDescriptionDto, { description: ' ' })),
    ).resolves.not.toEqual([]);
  });

  it.each([
    [BreedsController, 'list', ['racas:ler']],
    [BreedsController, 'create', ['racas:gerenciar']],
    [BatchesController, 'list', ['lotes:ler']],
    [BatchesController, 'deactivate', ['lotes:gerenciar']],
  ] as const)(
    '%s.%s declares its canonical permission',
    (controller, method, expected) => {
      expect(
        Reflect.getMetadata(PERMISSIONS_KEY, controller.prototype[method]),
      ).toEqual(expected);
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        JwtAuthGuard,
        PermissionsGuard,
      ]);
    },
  );

  it('delegates pagination and protocol values to the catalog use case', async () => {
    const useCase = {
      listBreeds: jest
        .fn()
        .mockResolvedValue({ data: [], page: 2, limit: 5, total: 0 }),
      createBreed: jest.fn().mockResolvedValue({ id: 1 }),
      getBreed: jest.fn(),
      updateBreed: jest.fn(),
      deactivateBreed: jest.fn(),
      listBatches: jest
        .fn()
        .mockResolvedValue({ data: [], page: 1, limit: 20, total: 0 }),
      createBatch: jest.fn(),
      getBatch: jest.fn(),
      updateBatch: jest.fn(),
      deactivateBatch: jest.fn().mockResolvedValue({ id: 3, active: false }),
    };
    const breeds = new BreedsController(
      useCase as unknown as ManageHerdCatalogUseCase,
    );
    const batches = new BatchesController(
      useCase as unknown as ManageHerdCatalogUseCase,
    );

    await breeds.list({ page: 2, limit: 5 });
    await breeds.create({ description: 'Nelore' });
    await batches.list({ page: 1, limit: 20 });
    await batches.deactivate(3);

    expect(useCase.listBreeds).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(useCase.createBreed).toHaveBeenCalledWith({ description: 'Nelore' });
    expect(useCase.listBatches).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(useCase.deactivateBatch).toHaveBeenCalledWith({ id: 3 });
  });
});
