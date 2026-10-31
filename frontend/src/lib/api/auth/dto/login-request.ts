/**
 * @typedef {Object} LoginRequest
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "LoginRequest struct"
 *
 * @property {string} login - User login (username or email)
 * @property {string} password - User password
 */

/**
 * @typedef {Object} LoginResponse
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "LoginResponse struct"
 *
 * @property {import('./user-response').User} user - Logged in user info
 */

export interface LoginRequest {
  login: string;
  password: string;
}