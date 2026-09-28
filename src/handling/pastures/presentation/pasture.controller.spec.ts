import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { ManagePasturesUseCase } from '../application/use-cases/manage-pastures.use-case';
import { PastureInputDto } from './dto/pasture.dto';
import { PastureController } from './pasture.controller';

describe('pasture HTTP boundary', () => {
  it('validates camelCase input and trims description', async () => {
    const dto = plainToInstance(PastureInputDto, {
      description: '  Pasto Norte  ',
      geoJson: { type: 'Feature' },
      areaHectares: '12.500',
    });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.description).toBe('Pasto Norte');
    await expect(
      validate(
        plainToInstance(PastureInputDto, {
          description: ' ',
          geoJson: { type: 'Feature' },
        }),
      ),
    ).resolves.not.toEqual([]);
  });

  it.each([
    ['list', ['pastos:ler']],
    ['create', ['pastos:gerenciar']],
    ['deactivate', ['pastos:gerenciar']],
  ] as const)(
    '%s declares canonical guards and permission',
    (method, permission) => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_KEY,
          PastureController.prototype[method],
        ),
      ).toEqual(permission);
      expect(Reflect.getMetadata(GUARDS_METADATA, PastureController)).toEqual([
        JwtAuthGuard,
        PermissionsGuard,
      ]);
    },
  );

  it('delegates protocol values without business logic', async () => {
    const useCase = {
      list: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0, page: 2, limit: 5 }),
      get: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 3 }),
      update: jest.fn(),
      deactivate: jest.fn().mockResolvedValue({ id: 3, active: false }),
    };
    const controller = new PastureController(
      useCase as unknown as ManagePasturesUseCase,
    );
    const dto = { description: 'Pasto', geoJson: {}, areaHectares: '1.000' };
    await controller.list({ page: 2, limit: 5 });
    await controller.create(dto);
    await controller.deactivate(3);
    expect(useCase.list).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(useCase.create).toHaveBeenCalledWith(dto);
    expect(useCase.deactivate).toHaveBeenCalledWith({ id: 3 });
  });
});
