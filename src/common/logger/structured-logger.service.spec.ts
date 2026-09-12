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
});
