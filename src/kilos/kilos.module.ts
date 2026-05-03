import { Module } from '@nestjs/common';
import { KilosController } from './kilos.controller';
import { KilosService } from './kilos.service';

@Module({ controllers: [KilosController], providers: [KilosService], exports: [KilosService] })
export class KilosModule { }
