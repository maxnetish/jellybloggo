/**
 * @typedef {Object} User
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/users/model.go
 *      "UserResponse struct" (lines 95-106)
 *
 * User profile data returned by the API.
 *
 * @property {string} id - Unique user identifier
 * @property {string} login - User login (unique, email or username)
 * @property {string[]} roles - Role names assigned to user (e.g., ["admin", "author", "reader"])
 * @property {string} [full_name] - Full name. Optional, max 256 characters.
 * @property {string} [birth_date] - Birth date in YYYY-MM-DD format. Optional.
 * @property {string} [location] - User location. Optional, max 256 characters.
 * @property {string} [avatar_url] - Avatar image URL. Must be valid URL, max 500 characters.
 * @property {string} [about] - Short biography ("About me"). Optional, max 4096 characters.
 * @property {string} created_at - Creation timestamp (ISO 8601 format)
 * @property {string} updated_at - Last update timestamp (ISO 8601 format)
 */
export interface User {
  id: string;
  login: string;
  roles: string[];
  full_name?: string;
  birth_date?: string;
  location?: string;
  avatar_url?: string;
  about?: string;
  created_at?: string;
  updated_at?: string;
}