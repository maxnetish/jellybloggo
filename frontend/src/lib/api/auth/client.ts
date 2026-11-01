/**
 * Authentication API client.
 *
 * Uses HTTP-only cookies for authentication (access_token, refresh_token).
 * Cookies are automatically sent with each request.
 *
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/README_UI.md
 */

import type { LoginRequest } from "./dto";
import type { UserResponse } from "./dto";

/**
 * Login user.
 *
 * Sends credentials to the backend. On success, backend sets
 * HTTP-only cookies (access_token, refresh_token).
 *
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/README_UI.md
 *      "POST /api/auth/login"
 *
 * @param {LoginRequest} data - Login credentials
 * @returns {Promise<User>} Logged in user info
 * @throws {Error} If login fails (non-2xx response)
 */
export async function login(data: LoginRequest): Promise<UserResponse['user']> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const result: UserResponse = await response.json();
  if (!result.user) {
    throw new Error("Login response missing user");
  }

  return result.user;
}

/**
 * Logout user.
 *
 * Clears authentication cookies on the backend.
 *
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/README_UI.md
 *      "POST /api/auth/logout"
 *
 * @returns {Promise<void>}
 */
export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
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
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/README_UI.md
 *      "GET /api/auth/user"
 *
 * @returns {Promise<User | null>} User info or null if not authenticated
 */
export async function getUser(): Promise<UserResponse['user'] | null> {
  const response = await fetch("/api/auth/user", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    // User not authenticated or session expired - return null, don't throw
    return null;
  }

  const result: UserResponse = await response.json();
  return result.user;
}