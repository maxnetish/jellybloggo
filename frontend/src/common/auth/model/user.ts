import { UserRole } from './user-role';

/**
 * @see backend/internal/users/model.go:User
 */
export interface User {
  id: string;
  login: string;
  roles: UserRole[];
  created_at: string;
  updated_at: string;
}
