package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// ContextKeyUserID - ключ для хранения userID в контексте запроса.
// Используется для передачи данных между middleware и handlers.
const ContextKeyUserID = "userID"

// JWTMiddleware проверяет JWT токен в заголовке Authorization.
// Возвращает 401 если токен отсутствует или невалиден.
// Этот middleware - ШАБЛОН, требует доработки (проверка подписи, expiry и т.д.)
// @Security BearerAuth
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Получаем заголовок Authorization из запроса
		// Формат: "Bearer <token>"
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		// SplitN разделяет строку на 2 части по первому пробелу
		// "Bearer token123" -> ["Bearer", "token123"]
		// SplitN безопасен, не паникует если разделителя нет
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// ParseUnverified парсит токен БЕЗ проверки подписи
		// Подходит для извлечения данных (sub, exp, etc.) на этапе отладки
		// В продакшене использовать Parse() с ключом
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil || token == nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Извлекаем claim "sub" (subject = user ID) из токена
		// jwt.MapClaims - это map[string]interface{}, содержит все claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"].(string); ok {
				// context.WithValue создаёт новый контекст с переданным значением
				// r.WithContext заменяет контекст в запросе
				// Теперь обработчик может получить userID через r.Context().Value(ContextKeyUserID)
				ctx := context.WithValue(r.Context(), ContextKeyUserID, sub)
				r = r.WithContext(ctx)
			}
		}

		// Вызываем следующий обработчик в цепочке
		// Это важно: middleware должен вызвать next.ServeHTTP()
		next.ServeHTTP(w, r)
	})
}

// ProtectedHandler возвращает информацию о текущем пользователе.
// Требует валидный JWT токен (проверяется JWTMiddleware).
// @Summary Protected endpoint
// @Description Возвращает ID текущего пользователя из JWT
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} ProtectedResponse
// @Failure 401 {object} ErrorResponse
// @Router /api/protected [get]
func ProtectedHandler(w http.ResponseWriter, r *http.Request) {
	// Получаем userID из контекста, который был установлен JWTMiddleware
	userID := r.Context().Value(ContextKeyUserID)
	w.Header().Set("Content-Type", "application/json")
	// Для простоты используем w.Write + строка
	// В реальном коде лучше json.NewEncoder(w).Encode()
	w.Write([]byte(`{"user_id":"` + userID.(string) + `"}`))
}

type ProtectedResponse struct {
	UserID string `json:"user_id"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}