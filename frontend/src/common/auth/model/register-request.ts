/**
 * DTO для регистрации нового пользователя.
 *
 * @see backend/internal/auth/README_UI.md — раздел "Register"
 */
export interface RegisterRequest {
  /** Имя пользователя (логин). Должно быть уникальным. */
  login: string;
  /** Пароль. Должен удовлетворять требованиям сложности (верхний/нижний регистр, цифра, спецсимвол). */
  password: string;
  /** Токен приглашения, полученный от администратора. */
  invitation_token: string;
}