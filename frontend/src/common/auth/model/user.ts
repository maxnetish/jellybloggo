import { UserRole } from './user-role';

/**
 * @see backend/internal/users/model.go:User
 */
export interface User {
  id: string;
  login: string;
  roles: UserRole[];
  /**
   * json date
   */
  created_at: string;
  /**
   * json date
   */
  updated_at: string;
}
