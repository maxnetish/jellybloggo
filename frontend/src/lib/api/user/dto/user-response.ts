/**
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/users/model.go
 *      "UserResponse struct" (lines 95-106)
 *
 * @property {string} id - Unique user identifier
 * @property {string} login - User login
 * @property {string[]} roles - User role names (e.g., ["admin", "author", "reader"])
 * @property {string | null} full_name - Full name
 * @property {string | null} birth_date - Birth date in YYYY-MM-DD format
 * @property {string | null} location - User location
 * @property {string | null} avatar_url - Avatar image URL
 * @property {string | null} about - Short biography
 * @property {string} created_at - Creation timestamp (ISO 8601 format)
 * @property {string} updated_at - Last update timestamp (ISO 8601 format)
 */
export interface UserResponse {
  id: string;
  login: string;
  roles: string[];
  full_name: string | null;
  birth_date: string | null;
  location: string | null;
  avatar_url: string | null;
  about: string | null;
  created_at: string;
  updated_at: string;
}