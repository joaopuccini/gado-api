import { Module } from '@nestjs/common';
import { AnimaisController } from './animais.controller';
import { AnimaisService } from './animais.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [TenantModule],
    controllers: [AnimaisController],
    providers: [AnimaisService],
    exports: [AnimaisService],
})
export class AnimaisModule { }
