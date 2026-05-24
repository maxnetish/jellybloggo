/**
 * DTO для входа в систему.
 *
 * @see backend/internal/auth/README_UI.md — раздел "Login"
 * @see backend/internal/auth/handler.go — структура login credentials
 */
export interface LoginRequest {
  login: string;
  password: string;
}
