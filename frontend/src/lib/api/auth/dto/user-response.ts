import { User } from '../../user/dto';

/**
 * @typedef {Object} UserResponse
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/auth/model.go
 *      "UserResponse struct" (lines 88-90)
 *
 * Response wrapper for user-related endpoints.
 * Returned by GET /api/auth/user.
 *
 * @property {User | null} user - User profile data or null if not authenticated
 */

export interface UserResponse {
  user: User | null;
}