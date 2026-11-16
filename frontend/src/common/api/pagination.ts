/**
 * @see backend/internal/pagination/pagination.go:Pagination
 */
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  sort_by: string;
  sort_dir: string;
}