import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { ApiSuccessResponse } from '../contracts/api-envelope';
import { ExecutionContextStore } from '../context';
export declare class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T> | undefined> {
    private readonly contextStore;
    constructor(contextStore: ExecutionContextStore);
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T> | undefined>;
}
