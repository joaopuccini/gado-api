import { Module } from '@nestjs/common';
import { FarmsModule } from './farms/farms.module';
import { TeamModule } from './team/team.module';

@Module({ imports: [FarmsModule, TeamModule] })
export class AccountModule {}
