import { Module } from '@nestjs/common';
import { TransacoesBancariasController } from './transacoes-bancarias.controller';
import { TransacoesBancariasService } from './transacoes-bancarias.service';

@Module({
  controllers: [TransacoesBancariasController],
  providers: [TransacoesBancariasService]
})
export class TransacoesBancariasModule {}
