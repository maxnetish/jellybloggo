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

// Login authenticates user with login and password.
// Returns access token in JSON body and refresh token in HTTP-only cookie.
// @Summary Login user
// @Description Authenticates user with login and password. Returns access token and sets refresh token cookie.
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse "Invalid request body"
// @Failure 401 {object} ErrorResponse "Invalid credentials"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/login [post]
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

// Refresh exchanges valid refresh token cookie for new access token.
// Returns new access token in JSON body and rotates refresh token cookie.
// @Summary Refresh access token
// @Description Exchanges valid refresh token cookie for new access token. Implements token rotation.
// @Tags auth
// @Produce json
// @Success 200 {object} RefreshResponse
// @Failure 401 {object} ErrorResponse "Missing, invalid, or expired refresh token"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/refresh [post]
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

// Logout invalidates refresh token cookie and logs out the user.
// @Summary Logout user
// @Description Invalidates refresh token and clears cookie.
// @Tags auth
// @Success 204 "No Content"
// @Router /api/auth/logout [post]
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

// GetUser returns current user info.
// If JWT token is provided and valid, returns user data.
// If no token or invalid token, returns 200 with null user.
// @Summary Get current user
// @Description Returns user info if authenticated, or null if not.
// @Tags auth
// @Produce json
// @Success 200 {object} UserResponse
// @Router /api/auth/user [get]
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
				next.ServeHTTP(w, r)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				next.ServeHTTP(w, r)
				return
			}

			userID, err := service.ValidateAccessToken(parts[1])
			if err != nil {
				next.ServeHTTP(w, r)
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