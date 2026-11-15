/**
 * @see backend/internal/auth/handler.go:UpdateRolesRequest
 */
export interface UpdateRolesRequest {
  login: string;
  roles: string[];
}