import type { Pagination } from "./pagination";

/**
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/pagination/pagination.go
 *      "Response[T] struct" (lines 12-15)
 *
 * Generic paginated response wrapper.
 *
 * @template T - Type of items in the content array
 * @property {T[]} content - Array of items for the current page
 * @property {Pagination} pagination - Pagination metadata
 */
export interface Response<T> {
  content: T[];
  pagination: Pagination;
}