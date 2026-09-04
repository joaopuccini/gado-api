import { Module, forwardRef } from '@nestjs/common';
import { AdminPrismaService } from './admin-prisma.service';
import { PlanosController } from './planos/planos.controller';
import { PlanosService } from './planos/planos.service';
import { OrganizacoesController } from './organizacoes/organizacoes.controller';
import { OrganizacoesService } from './organizacoes/organizacoes.service';
import { AssinaturasController } from './assinaturas/assinaturas.controller';
import { AssinaturasService } from './assinaturas/assinaturas.service';
import { AdminUsuariosController } from './usuarios/admin-usuarios.controller';
import { AdminUsuariosService } from './usuarios/admin-usuarios.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    PlanosController,
    OrganizacoesController,
    AssinaturasController,
    AdminUsuariosController,
  ],
  providers: [
    AdminPrismaService,
    PlanosService,
    OrganizacoesService,
    AssinaturasService,
    AdminUsuariosService,
  ],
  exports: [AdminPrismaService],
})
export class AdminModule {}

