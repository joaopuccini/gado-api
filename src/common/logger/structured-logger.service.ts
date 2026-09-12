import {
  Inject,
  Injectable,
  type LoggerService,
  Optional,
} from '@nestjs/common';
import { ExecutionContextStore } from '../context';
import { redactLogValue } from './log-redactor';

export const STRUCTURED_LOG_SINK = Symbol('STRUCTURED_LOG_SINK');

export interface LogSink {
  write(line: string): void;
}

export interface StructuredLogRecord {
  [key: string]: unknown;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  service: 'gadoApi';
  environment: string;
  requestId?: string;
  traceId?: string;
  tenantId?: string;
  organizationId?: string;
  farmId?: number;
  module?: string;
  operation?: string;
  statusCode?: number;
  durationMs?: number;
  outcome?: 'success' | 'error';
  errorCode?: string;
}

const standardOutputSink: LogSink = {
  write(line: string): void {
    process.stdout.write(`${line}\n`);
  },
};

const scalarToString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol') return value.description ?? 'symbol';
  if (typeof value === 'function') return value.name || 'function';
  if (value === null) return 'null';
  return 'undefined';
};

const recordFrom = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value === undefined ? {} : { message: scalarToString(value) };
  }
  return value as Record<string, unknown>;
};

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly sink: LogSink;

  constructor(
    private readonly contextStore: ExecutionContextStore,
    @Optional()
    @Inject(STRUCTURED_LOG_SINK)
    sink?: LogSink,
  ) {
    this.sink = sink ?? standardOutputSink;
  }

  info(event: string, fields: Record<string, unknown> = {}): void {
    this.write('info', event, fields);
  }

  log(message: unknown, ...optionalParameters: unknown[]): void {
    this.write('info', this.eventName(message, 'applicationLog'), {
      ...recordFrom(optionalParameters[0]),
      ...(typeof message === 'string' ? {} : { message }),
    });
  }

  error(message: unknown, ...optionalParameters: unknown[]): void {
    this.write('error', this.eventName(message, 'applicationError'), {
      ...recordFrom(optionalParameters[0]),
      ...(typeof message === 'string' ? {} : { message }),
    });
  }

  warn(message: unknown, ...optionalParameters: unknown[]): void {
    this.write('warn', this.eventName(message, 'applicationWarning'), {
      ...recordFrom(optionalParameters[0]),
      ...(typeof message === 'string' ? {} : { message }),
    });
  }

  debug(message: unknown, ...optionalParameters: unknown[]): void {
    this.write('debug', this.eventName(message, 'applicationDebug'), {
      ...recordFrom(optionalParameters[0]),
      ...(typeof message === 'string' ? {} : { message }),
    });
  }

  verbose(message: unknown, ...optionalParameters: unknown[]): void {
    this.debug(message, ...optionalParameters);
  }

  private eventName(message: unknown, fallback: string): string {
    return typeof message === 'string' && message.length > 0
      ? message
      : fallback;
  }

  private write(
    level: StructuredLogRecord['level'],
    event: string,
    fields: Record<string, unknown>,
  ): void {
    const context = this.contextStore.current();
    const safeFields = recordFrom(redactLogValue(fields));
    const record: StructuredLogRecord = {
      ...safeFields,
      timestamp: new Date().toISOString(),
      level,
      event,
      service: 'gadoApi',
      environment: process.env.NODE_ENV ?? 'development',
      ...(context?.requestId ? { requestId: context.requestId } : {}),
      ...(context?.traceId ? { traceId: context.traceId } : {}),
      ...(context?.tenantId ? { tenantId: context.tenantId } : {}),
      ...(context?.organizationId
        ? { organizationId: context.organizationId }
        : {}),
      ...(context?.farmId !== undefined ? { farmId: context.farmId } : {}),
    };

    this.sink.write(JSON.stringify(record));
  }
}
