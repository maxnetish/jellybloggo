/**
 * @see backend/internal/auth/model.go:UpdateProfileRequest
 */
export interface ProfileUpdate {
  full_name?: string;
  birth_date?: string;
  location?: string;
  avatar_url?: string;
  about?: string;
}