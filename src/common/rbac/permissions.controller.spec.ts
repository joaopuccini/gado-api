import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PERMISSIONS_CATALOG } from './permissions-catalog';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCatalog', () => {
    it('should return permissions grouped by module', () => {
      const response = controller.getCatalog();
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      
      // Ensure it groups correctly (check for at least one known module from the catalog)
      const firstPermission = PERMISSIONS_CATALOG[0];
      if (firstPermission) {
        expect(response.data[firstPermission.module]).toBeDefined();
        const found = response.data[firstPermission.module].find(
          (p: any) => p.id === firstPermission.id
        );
        expect(found).toBeDefined();
        expect(found.code).toEqual(firstPermission.code);
      }
    });
  });
});
