import { Role, UserRole } from './user-role';

/**
 * @see backend/internal/users/model.go:User
 */
export interface User {
  id: string;
  login: string;
  roles: Role[];
  /**
   * json date
   */
  created_at: string;
  /**
   * json date
   */
  updated_at: string;
}
