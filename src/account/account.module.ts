import { Module } from '@nestjs/common';
import { FarmsModule } from './farms/farms.module';

@Module({ imports: [FarmsModule] })
export class AccountModule {}
