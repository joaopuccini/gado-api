import { Module } from '@nestjs/common';
import { AlmoxarifadosController } from './almoxarifados.controller';
import { AlmoxarifadosService } from './almoxarifados.service';

@Module({
  controllers: [AlmoxarifadosController],
  providers: [AlmoxarifadosService]
})
export class AlmoxarifadosModule {}
