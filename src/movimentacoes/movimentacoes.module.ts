import { Module } from '@nestjs/common';
import { MovimentoPastoController, MovimentoLoteController } from './movimentacoes.controller';
import { MovimentoPastoService, MovimentoLoteService } from './movimentacoes.service';

@Module({
    controllers: [MovimentoPastoController, MovimentoLoteController],
    providers: [MovimentoPastoService, MovimentoLoteService],
    exports: [MovimentoPastoService, MovimentoLoteService],
})
export class MovimentacoesModule { }
