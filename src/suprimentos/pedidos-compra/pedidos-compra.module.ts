import { Module } from '@nestjs/common';
import { PedidosCompraController } from './pedidos-compra.controller';
import { PedidosCompraService } from './pedidos-compra.service';

@Module({
  controllers: [PedidosCompraController],
  providers: [PedidosCompraService]
})
export class PedidosCompraModule {}
