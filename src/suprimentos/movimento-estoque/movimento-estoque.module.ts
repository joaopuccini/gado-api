import { Module } from '@nestjs/common';
import { MovimentoEstoqueController } from './movimento-estoque.controller';
import { MovimentoEstoqueService } from './movimento-estoque.service';

@Module({
  controllers: [MovimentoEstoqueController],
  providers: [MovimentoEstoqueService]
})
export class MovimentoEstoqueModule {}
