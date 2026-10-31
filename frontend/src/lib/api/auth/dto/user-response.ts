/**
 * @typedef {Object} User
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "User struct"
 *
 * @property {string} id - Unique user identifier
 * @property {string} login - User login name
 * @property {string[]} roles - User roles (e.g., ["admin", "user"])
 */

/**
 * @typedef {Object} UserResponse
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "UserResponse struct"
 *
 * @property {User | null} user - User info or null if not authenticated
 */

export interface User {
  id: string;
  login: string;
  roles: string[];
}

export interface UserResponse {
  user: User | null;
}