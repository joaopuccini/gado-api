import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ExecutionContextStore } from '../context';
import { StructuredLogger } from '../logger/structured-logger.service';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly contextStore;
    private readonly logger;
    constructor(contextStore: ExecutionContextStore, logger: StructuredLogger);
    catch(exception: unknown, host: ArgumentsHost): void;
    private normalize;
}
