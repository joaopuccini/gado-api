import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { CreateFarmUseCase } from '../application/use-cases/create-farm.use-case';
import type { DeactivateFarmUseCase } from '../application/use-cases/deactivate-farm.use-case';
import type { ListFarmsUseCase } from '../application/use-cases/list-farms.use-case';
import type { SelectFarmUseCase } from '../application/use-cases/select-farm.use-case';
import type { UpdateFarmUseCase } from '../application/use-cases/update-farm.use-case';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmsController } from './farms.controller';

const FARM = { id: 20, name: 'Fazenda Sul', parentId: 10, active: true };

describe('farm HTTP boundary', () => {
  it('validates and trims a create command', async () => {
    const dto = plainToInstance(CreateFarmDto, {
      name: '  Fazenda Sul  ',
      parentId: 10,
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto).toEqual({ name: 'Fazenda Sul', parentId: 10 });
  });

  it.each([
    [{ name: 'x' }, 'name shorter than two characters'],
    [{ name: 'Fazenda', parentId: 0 }, 'non-positive parent id'],
  ])('rejects invalid create DTO: %s (%s)', async (input) => {
    const errors = await validate(plainToInstance(CreateFarmDto, input));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an empty update command', async () => {
    const errors = await validate(plainToInstance(UpdateFarmDto, {}));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('delegates protocol values to use cases and returns raw domain results', async () => {
    const create = { execute: jest.fn().mockResolvedValue(FARM) };
    const list = { execute: jest.fn().mockResolvedValue([FARM]) };
    const update = { execute: jest.fn().mockResolvedValue(FARM) };
    const select = {
      execute: jest
        .fn()
        .mockResolvedValue({ accessToken: 'token', expiresIn: 3600 }),
    };
    const deactivate = {
      execute: jest.fn().mockResolvedValue({ ...FARM, active: false }),
    };
    const controller = new FarmsController(
      create as unknown as CreateFarmUseCase,
      list as unknown as ListFarmsUseCase,
      update as unknown as UpdateFarmUseCase,
      select as unknown as SelectFarmUseCase,
      deactivate as unknown as DeactivateFarmUseCase,
    );

    await expect(controller.list()).resolves.toEqual([FARM]);
    await expect(
      controller.create({ name: 'Fazenda Sul', parentId: 10 }),
    ).resolves.toEqual(FARM);
    await expect(
      controller.update(20, { name: 'Fazenda Sul' }),
    ).resolves.toEqual(FARM);
    await expect(controller.select(20)).resolves.toEqual({
      accessToken: 'token',
      expiresIn: 3600,
    });
    await expect(controller.deactivate(20)).resolves.toEqual({
      ...FARM,
      active: false,
    });

    expect(create.execute).toHaveBeenCalledWith({
      name: 'Fazenda Sul',
      parentId: 10,
    });
    expect(update.execute).toHaveBeenCalledWith({
      farmId: 20,
      name: 'Fazenda Sul',
    });
    expect(select.execute).toHaveBeenCalledWith({ farmId: 20 });
    expect(deactivate.execute).toHaveBeenCalledWith({ farmId: 20 });
  });
});
