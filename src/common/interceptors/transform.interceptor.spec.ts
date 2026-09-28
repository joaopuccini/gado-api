import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ExecutionContextStore } from '../context';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor pagination contract', () => {
  it('places list items in data and canonical pagination in meta', async () => {
    const context = new ExecutionContextStore();
    const interceptor = new TransformInterceptor(context);
    const execution = {
      switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }),
    } as unknown as ExecutionContext;
    const next = {
      handle: () =>
        of({
          data: [{ id: 11, kind: 'pasture' }],
          page: 2,
          pageSize: 5,
          totalItems: 12,
          totalPages: 3,
        }),
    } as CallHandler;

    const result = await context.run(
      {
        requestId: 'request-pagination',
        traceId: 'trace-pagination',
        contextType: 'public',
        startedAt: 1,
        accessibleFarmIds: [],
        permissions: [],
      },
      () => firstValueFrom(interceptor.intercept(execution, next)),
    );

    expect(result).toEqual({
      data: [{ id: 11, kind: 'pasture' }],
      meta: {
        requestId: 'request-pagination',
        page: 2,
        pageSize: 5,
        totalItems: 12,
        totalPages: 3,
      },
    });
  });
});
