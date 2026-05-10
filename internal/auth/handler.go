package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/maxnetish/jellybloggo/internal/users"
)

const (
	ContextKeyUserID = "userID"
	ContextKeyUser   = "user"

	RefreshTokenCookie = "refresh_token"
	CookieMaxAge       = 7 * 24 * 60 * 60
)

type AuthHandler struct {
	service  *AuthService
	userRepo users.UserRepository
}

func NewAuthHandler(service *AuthService, userRepo users.UserRepository) *AuthHandler {
	return &AuthHandler{
		service:  service,
		userRepo: userRepo,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	accessToken, user, err := h.service.Login(ctx, req.Login, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			http.Error(w, `{"error":"invalid credentials"}`, http.StatusUnauthorized)
			return
		}
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.service.CreateRefreshToken(ctx, user.ID)
	if err != nil {
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    refreshToken,
		MaxAge:   CookieMaxAge,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		AccessToken: accessToken,
		User:        user,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(RefreshTokenCookie)
	if err != nil {
		http.Error(w, `{"error":"missing refresh token"}`, http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	accessToken, user, err := h.service.Refresh(ctx, cookie.Value)
	if err != nil {
		if errors.Is(err, ErrRefreshTokenExpired) {
			http.SetCookie(w, &http.Cookie{
				Name:   RefreshTokenCookie,
				Value:  "",
				MaxAge: -1,
				Path:   "/",
			})
			http.Error(w, `{"error":"refresh token expired"}`, http.StatusUnauthorized)
			return
		}
		if errors.Is(err, ErrRefreshTokenInvalid) {
			http.Error(w, `{"error":"invalid refresh token"}`, http.StatusUnauthorized)
			return
		}
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	newRefreshToken, err := h.service.CreateRefreshToken(ctx, user.ID)
	if err != nil {
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    newRefreshToken,
		MaxAge:   CookieMaxAge,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RefreshResponse{
		AccessToken: accessToken,
		User:        user,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(RefreshTokenCookie)
	if err == nil {
		h.service.Logout(r.Context(), cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:   RefreshTokenCookie,
		Value:  "",
		MaxAge: -1,
		Path:   "/",
	})

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(int)
	if !ok || userID == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(UserResponse{User: nil})
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil || user == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(UserResponse{User: nil})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{User: user})
}

func JWTMiddleware(service *AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			userID, err := service.ValidateAccessToken(parts[1])
			if err != nil {
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserMiddleware(userRepo users.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := r.Context().Value(ContextKeyUserID).(int)
			if !ok || userID == 0 {
				next.ServeHTTP(w, r)
				return
			}

			user, err := userRepo.GetByID(r.Context(), userID)
			if err != nil || user == nil {
				next.ServeHTTP(w, r)
				return
			}

			ctx := context.WithValue(r.Context(), ContextKeyUser, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}