package auth

import (
	"context"
	"net/http"
	"strings"
)

const ContextKeyTokenRefreshed = "tokenRefreshed"

type RefreshResult struct {
	AccessToken  string
	RefreshToken string
	User         interface{}
}

func TransparentRefreshMiddleware(service *AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := extractAccessToken(r)

			var userID string

			if tokenString != "" {
				var err error
				userID, err = service.ValidateAccessToken(tokenString)
				if err == nil {
					ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			refreshCookie, err := r.Cookie(RefreshTokenCookie)
			if err == nil && refreshCookie.Value != "" {
				result, err := service.FullRefresh(r.Context(), refreshCookie.Value)
				if err == nil && result != nil {
					userID = result.UserID

					setAccessTokenCookie(w, r, result.AccessToken)
					setRefreshTokenCookie(w, r, result.RefreshToken)

					ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
					ctx = context.WithValue(ctx, ContextKeyTokenRefreshed, true)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			if userID != "" {
				ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func extractAccessToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1]
		}
	}

	cookie, err := r.Cookie(AccessTokenCookie)
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

func setAccessTokenCookie(w http.ResponseWriter, r *http.Request, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     AccessTokenCookie,
		Value:    token,
		MaxAge:   15 * 60,
		HttpOnly: true,
		Secure:   isSecureCookie(r),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
}

func setRefreshTokenCookie(w http.ResponseWriter, r *http.Request, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    token,
		MaxAge:   CookieMaxAge,
		HttpOnly: true,
		Secure:   isSecureCookie(r),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
}