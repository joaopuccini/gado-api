import { Module } from '@nestjs/common';
import { ContasReceberController } from './contas-receber.controller';
import { ContasReceberService } from './contas-receber.service';

@Module({
  controllers: [ContasReceberController],
  providers: [ContasReceberService]
})
export class ContasReceberModule {}
