import { Role } from './user-role';

/**
 * @see backend/internal/users/model.go:User
 */
export interface User {
  id: string;
  login: string;
  roles: Role[];
  /**
   * User's full name (e.g. "John Doe").
   */
  full_name?: string;
  /**
   * User's birth date for profile/demographics.
   */
  birth_date?: string;
  /**
   * User's location (e.g. "Moscow, Russia").
   */
  location?: string;
  /**
   * URL to user's avatar image.
   */
  avatar_url?: string;
  /**
   * User's bio/description for profile page.
   */
  about?: string;
  /**
   * json date
   */
  created_at: string;
  /**
   * json date
   */
  updated_at: string;
}
