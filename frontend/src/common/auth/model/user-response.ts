import { User } from './user';

/**
 * @see backend/internal/auth/model.go:UserResponse
 */
export interface UserResponse {
  user: User | null;
}
