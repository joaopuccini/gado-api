import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FazendasController } from './fazendas.controller';
import { FazendasService } from './fazendas.service';

@Module({
    imports: [PrismaModule],
    controllers: [FazendasController],
    providers: [FazendasService],
    exports: [FazendasService],
})
export class FazendasModule { }
