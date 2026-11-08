/**
 * Authentication API client.
 *
 * Browser-only service: talks to the backend through the Next.js proxy
 * (`/api/*` → backend, see `next.config.ts` rewrites). Authentication is
 * carried by HTTP-only cookies (access_token, refresh_token) which the
 * browser attaches to every request automatically.
 *
 * This is the only place in the app that knows how auth endpoints are
 * called. Components and the auth context must go through these functions.
 *
 * @see backend/internal/auth/README_UI.md
 */

import type { LoginRequest, User, UserResponse } from './dto';
import { ApiError, parseApiError } from './errors';

/** Options shared by every auth request. */
const defaultOptions: RequestInit = {
  credentials: 'include',
};

/**
 * Login user.
 *
 * Sends credentials to the backend. On success, backend sets
 * HTTP-only cookies (access_token, refresh_token).
 *
 * @see backend/internal/auth/README_UI.md "POST /api/auth/login"
 *
 * @param {LoginRequest} data - Login credentials
 * @returns {Promise<User>} Logged in user info
 * @throws {ApiError} If login fails (non-2xx response)
 */
export async function login(data: LoginRequest): Promise<User> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...defaultOptions,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const result: UserResponse = await response.json();
  if (!result.user) {
    throw new ApiError('Login response missing user', 'INTERNAL_ERROR', 500);
  }

  return result.user;
}

/**
 * Logout user.
 *
 * Clears authentication cookies on the backend.
 *
 * @see backend/internal/auth/README_UI.md "POST /api/auth/logout"
 *
 * @returns {Promise<void>}
 * @throws {Error} If the request fails (non-2xx response)
 */
export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    ...defaultOptions,
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }
}

/**
 * Get current authenticated user.
 *
 * Returns null if user is not authenticated.
 * This function does NOT throw on 401 or when user is not logged in.
 *
 * @see backend/internal/auth/README_UI.md "GET /api/auth/user"
 *
 * @returns {Promise<User | null>} User info or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  const response = await fetch('/api/auth/user', {
    method: 'GET',
    ...defaultOptions,
  });

  if (!response.ok) {
    // User not authenticated or session expired - return null, don't throw
    return null;
  }

  const result: UserResponse = await response.json();
  return result.user;
}

/**
 * Update current user's profile.
 *
 * Sends partial profile data to the backend. Only provided fields are updated.
 *
 * @see backend/internal/auth/README_UI.md "PATCH /api/auth/user"
 *
 * @param {Partial<User>} data - Profile fields to update
 * @returns {Promise<User>} Updated user info
 * @throws {ApiError} If update fails (non-2xx response)
 */
export async function updateProfile(
  data: Partial<Pick<User, 'full_name' | 'birth_date' | 'location' | 'about'>>
): Promise<User> {
  const response = await fetch('/api/auth/user', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...defaultOptions,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const result: UserResponse = await response.json();
  if (!result.user) {
    throw new ApiError('Update response missing user', 'INTERNAL_ERROR', 500);
  }

  return result.user;
}

/**
 * Update user roles.
 *
 * Allows an admin to change roles for a target user.
 *
 * @see backend/internal/auth/README_UI.md "POST /api/auth/roles"
 *
 * @param {string} login - Target user login
 * @param {string[]} roles - Roles to assign (can be empty to remove all)
 * @returns {Promise<void>}
 * @throws {ApiError} If update fails (401, 403, 400, 500)
 */
export async function updateUserRoles(login: string, roles: string[]): Promise<void> {
  const response = await fetch('/api/auth/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, roles }),
    ...defaultOptions,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

/**
 * Delete a user.
 *
 * Permanently removes a user account. This action cannot be undone.
 *
 * @see backend/internal/auth/README_UI.md "DELETE /api/auth/user"
 *
 * @param {string} login - Login of the user to delete
 * @returns {Promise<void>}
 * @throws {ApiError} If delete fails (401, 403, 404, 500)
 */
export async function deleteUser(login: string): Promise<void> {
  const url = new URL('/api/auth/user', window.location.origin);
  url.searchParams.set('login', login);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    ...defaultOptions,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}
