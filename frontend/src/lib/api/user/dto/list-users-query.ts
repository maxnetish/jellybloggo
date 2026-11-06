import type { UserRoleValue } from './user-role';

/**
 * Query parameters for listing users.
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/users/handler.go
 *      "ListUsers handler" (lines 64-130)
 *
 * @property {string[]} roles - Filter by roles (repeatable, collectionFormat: multi)
 * @property {string} search - Search by login (partial, case-insensitive, max 100 chars)
 * @property {"login" | "created_at" | "updated_at"} sort_by - Sort field
 * @property {"asc" | "desc"} sort_dir - Sort direction
 * @property {number} page - Page number (min: 1)
 * @property {number} per_page - Items per page (min: 1, max: 100)
 *
 * Note: Next.js searchParams always provides strings/arrays of strings.
 * Backend values (UserRoleValue) are validated at runtime.
 */
export interface ListUsersQuery {
  roles?: string[];
  search?: string;
  sort_by?: 'login' | 'created_at' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

/**
 * Normalized query with validated role values for API calls.
 */
export interface NormalizedListUsersQuery {
  roles?: UserRoleValue[];
  search?: string;
  sort_by?: ListUsersQuery['sort_by'];
  sort_dir?: ListUsersQuery['sort_dir'];
  page: number;
  per_page: number;
}
