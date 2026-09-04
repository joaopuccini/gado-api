import { Module } from '@nestjs/common';
import { SafrasController } from './safras.controller';
import { SafrasService } from './safras.service';

@Module({
  controllers: [SafrasController],
  providers: [SafrasService]
})
export class SafrasModule {}
