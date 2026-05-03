import { Module } from '@nestjs/common';
import { CustosController, CustosTipoController } from './custos.controller';
import { CustosService, CustoTiposService } from './custos.service';

@Module({
    controllers: [CustosController, CustosTipoController],
    providers: [CustosService, CustoTiposService],
    exports: [CustosService, CustoTiposService],
})
export class CustosModule { }
