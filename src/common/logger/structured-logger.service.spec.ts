import { ExecutionContextStore, type ExecutionContextData } from '../context';
import {
  StructuredLogger,
  type LogSink,
  type StructuredLogRecord,
} from './structured-logger.service';

class MemoryLogSink implements LogSink {
  readonly lines: string[] = [];

  write(line: string): void {
    this.lines.push(line);
  }

  lastRecord(): StructuredLogRecord {
    const line = this.lines.at(-1);
    if (!line) throw new Error('No structured log was written');
    return JSON.parse(line) as StructuredLogRecord;
  }
}

const tenantContext: ExecutionContextData = {
  requestId: 'request-a',
  traceId: 'trace-a',
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_a',
  globalUserId: 'global-a',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['animals.read'],
};

describe('StructuredLogger', () => {
  it('writes one correlated JSON record without secrets', () => {
    const store = new ExecutionContextStore();
    const sink = new MemoryLogSink();
    const logger = new StructuredLogger(store, sink);

    store.run(tenantContext, () => {
      logger.info('httpRequestStarted', {
        authorization: 'Bearer secret',
        password: 'secret',
        operation: 'listAnimals',
        nested: {
          refreshToken: 'refresh-secret',
          safeValue: 'preserved',
        },
      });
    });

    expect(sink.lines).toHaveLength(1);
    expect(sink.lastRecord()).toMatchObject({
      level: 'info',
      event: 'httpRequestStarted',
      service: 'gadoApi',
      requestId: 'request-a',
      traceId: 'trace-a',
      tenantId: 'tenant-a',
      organizationId: 'organization-a',
      farmId: 10,
      operation: 'listAnimals',
      nested: { safeValue: 'preserved' },
    });
    expect(sink.lines[0]).not.toContain('Bearer secret');
    expect(sink.lines[0]).not.toContain('refresh-secret');
    expect(sink.lines[0]).not.toContain('"password"');
    expect(sink.lines[0]).not.toContain('"authorization"');
  });

  it('implements every Nest logger level with stable fallback event names', () => {
    const sink = new MemoryLogSink();
    const logger = new StructuredLogger(new ExecutionContextStore(), sink);

    logger.log(123, 7);
    logger.error('', true);
    logger.warn('warningEvent', 10n);
    logger.debug('debugEvent', Symbol('debug-symbol'));
    logger.verbose('verboseEvent', function namedDetail() {});
    logger.warn(undefined);

    expect(
      sink.lines.map((line) => {
        const record = JSON.parse(line) as StructuredLogRecord;
        return {
          level: record.level,
          event: record.event,
          message: record.message,
        };
      }),
    ).toEqual([
      { level: 'info', event: 'applicationLog', message: 123 },
      { level: 'error', event: 'applicationError', message: 'true' },
      { level: 'warn', event: 'warningEvent', message: '10' },
      {
        level: 'debug',
        event: 'debugEvent',
        message: 'debug-symbol',
      },
      { level: 'debug', event: 'verboseEvent', message: 'namedDetail' },
      {
        level: 'warn',
        event: 'applicationWarning',
        message: undefined,
      },
    ]);
  });

  it('uses the process output sink and development environment by default', () => {
    const previousEnvironment = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    const output = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    try {
      new StructuredLogger(new ExecutionContextStore()).info('healthChecked');

      const line = output.mock.calls[0]?.[0];
      expect(typeof line).toBe('string');
      expect(JSON.parse(String(line))).toMatchObject({
        event: 'healthChecked',
        environment: 'development',
      });
    } finally {
      output.mockRestore();
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });
});
