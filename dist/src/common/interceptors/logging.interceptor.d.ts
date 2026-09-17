import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StructuredLogger } from '../logger/structured-logger.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: StructuredLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
