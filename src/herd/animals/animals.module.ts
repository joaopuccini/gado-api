import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  ANIMAL_REPOSITORY,
  type AnimalRepository,
} from './application/ports/animal.repository';
import { ManageAnimalsUseCase } from './application/use-cases/manage-animals.use-case';
import { PrismaAnimalRepository } from './infrastructure/prisma-animal.repository';
import { AnimalsController } from './presentation/animal.controller';

@Module({
  imports: [TenantModule],
  controllers: [AnimalsController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaAnimalRepository,
    { provide: ANIMAL_REPOSITORY, useExisting: PrismaAnimalRepository },
    {
      provide: ManageAnimalsUseCase,
      useFactory: (
        repository: AnimalRepository,
        context: ExecutionContextStore,
      ) => new ManageAnimalsUseCase(repository, context),
      inject: [ANIMAL_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class AnimalsModule {}
