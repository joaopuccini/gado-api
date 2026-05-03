import { Module } from '@nestjs/common';
import { ManejoController } from './manejo.controller';
import { ManejoService } from './manejo.service';

@Module({ controllers: [ManejoController], providers: [ManejoService], exports: [ManejoService] })
export class ManejoModule { }
