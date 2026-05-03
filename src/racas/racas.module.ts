import { Module } from '@nestjs/common';
import { RacasController } from './racas.controller';
import { RacasService } from './racas.service';

@Module({ controllers: [RacasController], providers: [RacasService], exports: [RacasService] })
export class RacasModule { }
