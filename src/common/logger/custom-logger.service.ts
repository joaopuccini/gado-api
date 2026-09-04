import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { RequestContext } from '../context/request-context';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  constructor(context?: string) {
    super(context || 'App');
  }

  private addRequestId(message: string): string {
    const requestId = RequestContext.getRequestId();
    const prefix = requestId !== 'no-request-id' ? `[ReqID: ${requestId.substring(0, 8)}] ` : '';
    return `${prefix}${message}`;
  }

  log(message: any, context?: string) {
    super.log(this.addRequestId(message), context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(this.addRequestId(message), stack, context);
  }

  warn(message: any, context?: string) {
    super.warn(this.addRequestId(message), context);
  }

  debug(message: any, context?: string) {
    super.debug(this.addRequestId(message), context);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.addRequestId(message), context);
  }
}
