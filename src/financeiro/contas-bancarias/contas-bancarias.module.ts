import { Module } from '@nestjs/common';
import { ContasBancariasController } from './contas-bancarias.controller';
import { ContasBancariasService } from './contas-bancarias.service';

@Module({
  controllers: [ContasBancariasController],
  providers: [ContasBancariasService]
})
export class ContasBancariasModule {}
