/**
 * @typedef {Object} LoginRequest
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "LoginRequest struct" (lines 14-21)
 *
 * Request body for user login endpoint.
 *
 * @property {string} login - User login (email or username). Required.
 * @property {string} password - User password. Required, minimum 8 characters.
 */

/**
 * @typedef {Object} LoginResponse
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "LoginResponse struct" (lines 80-82)
 *
 * @property {import('../../user/dto').User} user - Logged in user info
 */

export interface LoginRequest {
  login: string;
  password: string;
}