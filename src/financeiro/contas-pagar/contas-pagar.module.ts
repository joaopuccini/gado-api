import { Module } from '@nestjs/common';
import { ContasPagarController } from './contas-pagar.controller';
import { ContasPagarService } from './contas-pagar.service';

@Module({
  controllers: [ContasPagarController],
  providers: [ContasPagarService]
})
export class ContasPagarModule {}
