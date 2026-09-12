import { Global, Module } from '@nestjs/common';
import { ExecutionContextMiddleware } from './execution-context.middleware';
import { ExecutionContextStore } from './execution-context.store';

@Global()
@Module({
  providers: [ExecutionContextStore, ExecutionContextMiddleware],
  exports: [ExecutionContextStore, ExecutionContextMiddleware],
})
export class ContextModule {}
