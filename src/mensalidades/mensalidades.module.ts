import { Module } from '@nestjs/common';
import { MensalidadesController } from './mensalidades.controller';
import { MensalidadesService } from './mensalidades.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MensalidadesController],
    providers: [MensalidadesService],
    exports: [MensalidadesService],
})
export class MensalidadesModule { }
