/**
 * Ответ на создание приглашения.
 *
 * @see backend/internal/auth/README_UI.md — раздел "Invite"
 */
export interface InviteResponse {
  /** Токен приглашения, который нужно передать новому пользователю. */
  token: string;
  /** Время истечения токена в формате ISO 8601. */
  expires_at: string;
}