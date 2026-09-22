import { MODULE_METADATA } from '@nestjs/common/constants';
import type { JwtService } from '@nestjs/jwt';
import { TenantSchemaName } from '../../tenant/domain/tenant-schema-name';
import { FARM_REPOSITORY } from './application/ports/farm.repository';
import {
  FARM_ACCESS_REPOSITORY,
  FARM_SESSION_ISSUER,
} from './application/ports/farm-session.ports';
import { CreateFarmUseCase } from './application/use-cases/create-farm.use-case';
import { DeactivateFarmUseCase } from './application/use-cases/deactivate-farm.use-case';
import { ListFarmsUseCase } from './application/use-cases/list-farms.use-case';
import { SelectFarmUseCase } from './application/use-cases/select-farm.use-case';
import { UpdateFarmUseCase } from './application/use-cases/update-farm.use-case';
import { FarmsModule } from './farms.module';
import { JwtFarmSessionIssuer } from './infrastructure/jwt-farm-session.issuer';
import { FarmsController } from './presentation/farms.controller';

describe('FarmsModule composition', () => {
  it('signs a replacement gado-tenant token from verified farm claims', async () => {
    const signAsync = jest.fn().mockResolvedValue('farm-token');
    const issuer = new JwtFarmSessionIssuer({
      signAsync,
    } as unknown as JwtService);
    const claims = {
      globalUserId: '11111111-1111-4111-8111-111111111111',
      tenantId: 'tenant-a',
      organizationId: 'organization-a',
      schemaName: TenantSchemaName.parse(
        'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
      localUserId: 7,
      farmId: 20,
      role: 'GESTOR',
      permissions: ['configuracoes:ler'],
    };

    await expect(issuer.sign(claims)).resolves.toEqual({
      accessToken: 'farm-token',
      expiresIn: 3600,
    });
    expect(signAsync).toHaveBeenCalledWith({
      aud: 'gado-tenant',
      sub: claims.globalUserId,
      tenantId: claims.tenantId,
      organizationId: claims.organizationId,
      schemaName: claims.schemaName.value,
      usuarioLocalId: claims.localUserId,
      fazendaId: claims.farmId,
      role: claims.role,
      permissoes: claims.permissions,
    });
  });

  it('registers the controller, ports, and every farm use case', () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      FarmsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      FarmsModule,
    ) as unknown[];
    const tokens = providers.map((provider) => {
      if (typeof provider === 'function') return provider;
      if (
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider
      ) {
        return provider.provide;
      }
      return provider;
    });

    expect(controllers).toContain(FarmsController);
    expect(tokens).toEqual(
      expect.arrayContaining([
        FARM_REPOSITORY,
        FARM_ACCESS_REPOSITORY,
        FARM_SESSION_ISSUER,
        CreateFarmUseCase,
        ListFarmsUseCase,
        UpdateFarmUseCase,
        SelectFarmUseCase,
        DeactivateFarmUseCase,
      ]),
    );
  });
});
