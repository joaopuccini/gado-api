import { Module } from '@nestjs/common';
import { AnimaisController } from './animais.controller';
import { AnimaisService } from './animais.service';

@Module({
    controllers: [AnimaisController],
    providers: [AnimaisService],
    exports: [AnimaisService],
})
export class AnimaisModule { }
