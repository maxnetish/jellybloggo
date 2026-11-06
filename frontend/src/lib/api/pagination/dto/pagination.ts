/**
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/pagination/pagination.go
 *      "Pagination struct" (lines 3-10)
 *
 * @property {number} page - Current page number
 * @property {number} per_page - Number of items per page
 * @property {number} total - Total number of items
 * @property {number} total_pages - Total number of pages
 * @property {string} sort_by - Current sort field
 * @property {string} sort_dir - Current sort direction ("asc" or "desc")
 */
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  sort_by: string;
  sort_dir: string;
}