import { Module } from '@nestjs/common';
import { VacinacaoController } from './vacinacao.controller';
import { VacinacaoService } from './vacinacao.service';

@Module({ controllers: [VacinacaoController], providers: [VacinacaoService], exports: [VacinacaoService] })
export class VacinacaoModule { }
