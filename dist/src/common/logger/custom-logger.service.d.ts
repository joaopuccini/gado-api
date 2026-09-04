import { ConsoleLogger } from '@nestjs/common';
export declare class CustomLogger extends ConsoleLogger {
    constructor(context?: string);
    private addRequestId;
    log(message: any, context?: string): void;
    error(message: any, stack?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
}
