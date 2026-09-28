import type { ErrorDetail } from '../errors/error-catalog';

export interface ApiMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: readonly ErrorDetail[];
  };
  meta: ApiMeta & {
    timestamp: string;
    path: string;
  };
}
