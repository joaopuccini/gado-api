import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { GetPermissionsCatalogUseCase } from '../../identity-access/application/use-cases/get-permissions-catalog.use-case';
import { PermissionsController } from './permissions.controller';

describe('PermissionsController', () => {
  it('delegates catalog retrieval to the application use case', () => {
    const result = { data: { configuracoes: [] } };
    const execute = jest.fn().mockReturnValue(result);
    const useCase = {
      execute,
    } as unknown as GetPermissionsCatalogUseCase;
    const controller = new PermissionsController(useCase);

    expect(controller.getCatalog()).toBe(result);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('runs authentication before permission authorization', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PermissionsController,
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
  });
});
