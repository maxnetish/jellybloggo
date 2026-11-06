/**
 * User API client.
 *
 * @see backend/internal/users/handler.go "ListUsers handler"
 */

import type { ListUsersQuery, ListUsersResponse } from './dto';
import { parseApiError } from '@/lib/api/auth/errors';

/** Backend API base URL. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Build query string from ListUsersQuery.
 */
function buildQueryString(query: ListUsersQuery): string {
  const params = new URLSearchParams();

  if (query.roles) {
    const roles = Array.isArray(query.roles) ? query.roles : [query.roles];
    for (const role of roles) {
      if (role) {
        params.append('roles', role);
      }
    }
  }
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.sort_by) {
    params.set('sort_by', query.sort_by);
  }
  if (query.sort_dir) {
    params.set('sort_dir', query.sort_dir);
  }
  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }
  if (query.per_page !== undefined) {
    params.set('per_page', String(query.per_page));
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

interface ListUsersOptions {
  query?: ListUsersQuery;
  cookieHeader?: string | null;
}

/**
 * List users with pagination, filtering, and sorting.
 *
 * Requires admin role. For use in Server Components with cookies from headers().
 *
 * @see backend/internal/users/handler.go "GET /api/users"
 *
 * @param {ListUsersOptions} options
 * @param {ListUsersQuery} options.query - Query parameters
 * @param {string | null} options.cookieHeader - Cookie header value (from headers().get('cookie'))
 * @returns {Promise<ListUsersResponse>} Paginated list of users
 * @throws {ApiError} If request fails (401, 403, 500, etc.)
 */
export async function listUsers({
  query = {},
  cookieHeader = null,
}: ListUsersOptions): Promise<ListUsersResponse> {
  const queryString = buildQueryString(query);
  const headers: HeadersInit = {};

  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const response = await fetch(`${API_BASE}/api/users${queryString}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}
