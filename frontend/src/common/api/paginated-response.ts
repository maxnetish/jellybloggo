import { Pagination } from './pagination';

/**
 * @see backend/internal/pagination/pagination.go:Response
 */
export interface PaginatedResponse<T> {
  content: T[];
  pagination: Pagination;
}