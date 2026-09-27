import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { ManageAnimalsUseCase } from '../application/use-cases/manage-animals.use-case';
import { AnimalsController } from './animal.controller';
import { CreateAnimalDto, UpdateAnimalDto } from './dto/animal.dto';

const CREATE_INPUT = {
  loteId: 2,
  racaId: 3,
  pastoId: 4,
  numeroBrinco: 'BR-001',
  sexo: 'FEMEA' as const,
  tipoEntrada: 'NASCIMENTO' as const,
  dataEntrada: '2026-09-27',
};

describe('animal HTTP boundary', () => {
  it('accepts only the documented camelCase creation contract', async () => {
    const dto = plainToInstance(CreateAnimalDto, CREATE_INPUT);
    await expect(validate(dto)).resolves.toEqual([]);
    await expect(
      validate(
        plainToInstance(CreateAnimalDto, {
          id_lote: 2,
          id_raca: 3,
          id_pasto: 4,
          numero_brinco: 1,
        }),
      ),
    ).resolves.not.toEqual([]);
  });

  it('rejects an empty update and invalid animal enums', async () => {
    await expect(validate(plainToInstance(UpdateAnimalDto, {}))).resolves.not.toEqual([]);
    await expect(
      validate(plainToInstance(UpdateAnimalDto, { sexo: 'X' })),
    ).resolves.not.toEqual([]);
  });

  it.each([
    ['list', ['animais:ler']],
    ['get', ['animais:ler']],
    ['create', ['animais:criar']],
    ['update', ['animais:editar']],
    ['deactivate', ['animais:excluir']],
  ] as const)('declares canonical permission for %s', (method, expected) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, AnimalsController.prototype[method]),
    ).toEqual(expected);
    expect(Reflect.getMetadata(GUARDS_METADATA, AnimalsController)).toEqual([
      JwtAuthGuard,
      PermissionsGuard,
    ]);
  });

  it('delegates protocol values and exposes no seed operation', async () => {
    const useCase = {
      list: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 20, total: 0 }),
      get: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      deactivate: jest.fn().mockResolvedValue({ id: 1, ativo: false }),
    };
    const controller = new AnimalsController(
      useCase as unknown as ManageAnimalsUseCase,
    );

    await controller.list({ page: 1, limit: 20 });
    await controller.get(1);
    await controller.create(CREATE_INPUT);
    await controller.update(1, { nome: 'Lua' });
    await controller.deactivate(1);

    expect(useCase.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(useCase.get).toHaveBeenCalledWith({ id: 1 });
    expect(useCase.create).toHaveBeenCalledWith(CREATE_INPUT);
    expect(useCase.update).toHaveBeenCalledWith({ id: 1, nome: 'Lua' });
    expect(useCase.deactivate).toHaveBeenCalledWith({ id: 1 });
    expect('seed' in controller).toBe(false);
  });
});
