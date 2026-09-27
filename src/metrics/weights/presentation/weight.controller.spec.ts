import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { ManageWeightsUseCase } from '../application/use-cases/manage-weights.use-case';
import {
  CorrectWeightDto,
  CreateWeightDto,
  WeightPaginationDto,
} from './dto/weight.dto';
import { WeightController } from './weight.controller';

describe('weight HTTP boundary', () => {
  it('accepts the documented camelCase creation and correction contracts', async () => {
    await expect(
      validate(
        plainToInstance(CreateWeightDto, {
          animalId: 30,
          weight: 450.125,
          measuredAt: '2026-09-20',
          note: 'Curral',
        }),
      ),
    ).resolves.toEqual([]);
    await expect(
      validate(
        plainToInstance(CorrectWeightDto, {
          weight: 449.5,
          measuredAt: '2026-09-20',
          correctionReason: 'Erro de digitação',
        }),
      ),
    ).resolves.toEqual([]);
    await expect(
      validate(
        plainToInstance(CreateWeightDto, {
          animal_id: 30,
          peso: 450,
          data_pesagem: '2026-09-20',
        }),
      ),
    ).resolves.not.toEqual([]);
  });

  it('validates weight bounds, dates, correction reason and pagination', async () => {
    await expect(
      validate(
        plainToInstance(CreateWeightDto, {
          animalId: 30,
          weight: 3000.001,
          measuredAt: 'invalid',
        }),
      ),
    ).resolves.not.toEqual([]);
    await expect(
      validate(
        plainToInstance(CorrectWeightDto, {
          weight: 450,
          measuredAt: '2026-09-20',
          correctionReason: '   ',
        }),
      ),
    ).resolves.not.toEqual([]);
    await expect(
      validate(plainToInstance(WeightPaginationDto, { page: 0, limit: 101 })),
    ).resolves.not.toEqual([]);
  });

  it.each([
    ['list', ['pesagens:ler']],
    ['get', ['pesagens:ler']],
    ['create', ['pesagens:criar']],
    ['correct', ['pesagens:gerenciar']],
  ] as const)('declares canonical permission for %s', (method, expected) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, WeightController.prototype[method]),
    ).toEqual(expected);
    expect(Reflect.getMetadata(GUARDS_METADATA, WeightController)).toEqual([
      JwtAuthGuard,
      PermissionsGuard,
    ]);
  });

  it('delegates pagination, detail, creation and correction without tenant fields', async () => {
    const useCase = {
      list: jest
        .fn()
        .mockResolvedValue({ data: [], page: 1, limit: 20, total: 0 }),
      get: jest.fn().mockResolvedValue({ id: 40 }),
      register: jest.fn().mockResolvedValue({ id: 40 }),
      correct: jest.fn().mockResolvedValue({ id: 41 }),
    };
    const controller = new WeightController(
      useCase as unknown as ManageWeightsUseCase,
    );

    await controller.list({ page: 1, limit: 20, animalId: 30 });
    await controller.get(40);
    await controller.create({
      animalId: 30,
      weight: 450,
      measuredAt: '2026-09-20',
    });
    await controller.correct(40, {
      weight: 449.5,
      measuredAt: '2026-09-20',
      correctionReason: 'Erro de digitação',
    });

    expect(useCase.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      animalId: 30,
    });
    expect(useCase.get).toHaveBeenCalledWith({ id: 40 });
    expect(useCase.register).toHaveBeenCalledWith({
      animalId: 30,
      weight: 450,
      measuredAt: '2026-09-20',
    });
    expect(useCase.correct).toHaveBeenCalledWith({
      id: 40,
      weight: 449.5,
      measuredAt: '2026-09-20',
      correctionReason: 'Erro de digitação',
    });
  });
});
