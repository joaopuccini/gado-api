import { AppModule } from '../../../common/rbac/rbac.enums';
import { GetPermissionsCatalogUseCase } from './get-permissions-catalog.use-case';

describe('GetPermissionsCatalogUseCase', () => {
  it('returns the permissions catalog grouped by module', () => {
    const result = new GetPermissionsCatalogUseCase().execute();

    expect(result.data[AppModule.CONFIGURACOES]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'configuracoes:ler' }),
      ]),
    );
  });

  it('returns every catalog permission exactly once', () => {
    const result = new GetPermissionsCatalogUseCase().execute();
    const codes = Object.values(result.data)
      .flat()
      .map((permission) => permission.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain('configuracoes:gerenciar');
  });
});
