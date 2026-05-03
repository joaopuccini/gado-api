import { Module } from '@nestjs/common';
import { PastosController } from './pastos.controller';
import { PastosService } from './pastos.service';
@Module({ controllers: [PastosController], providers: [PastosService], exports: [PastosService] })
export class PastosModule { }
