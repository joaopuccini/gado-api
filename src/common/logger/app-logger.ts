import { ConsoleLogger, Injectable } from '@nestjs/common';
import { RequestContext } from '../context';

/**
 * Custom logger that automatically includes requestId in every log line.
 * Format: [Nest] [ReqId:abc12345] Message — [ServiceName]
 *
 * This ensures full traceability of every request from entry to exit.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
    private withReqId(message: unknown): string {
        const ctx = RequestContext.get();
        const msgStr = typeof message === 'string' ? message : String(message);
        if (ctx) {
            return `[ReqId:${ctx.requestId.substring(0, 8)}] ${msgStr}`;
        }
        return msgStr;
    }

    override log(message: unknown, ...optionalParams: unknown[]): void {
        super.log(this.withReqId(message), ...optionalParams);
    }

    override error(message: unknown, ...optionalParams: unknown[]): void {
        super.error(this.withReqId(message), ...optionalParams);
    }

    override warn(message: unknown, ...optionalParams: unknown[]): void {
        super.warn(this.withReqId(message), ...optionalParams);
    }

    override debug(message: unknown, ...optionalParams: unknown[]): void {
        super.debug(this.withReqId(message), ...optionalParams);
    }

    override verbose(message: unknown, ...optionalParams: unknown[]): void {
        super.verbose(this.withReqId(message), ...optionalParams);
    }
}
