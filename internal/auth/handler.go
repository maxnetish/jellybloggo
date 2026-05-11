package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/maxnetish/jellybloggo/internal/users"
	"github.com/maxnetish/jellybloggo/internal/validation"
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
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	ctx := r.Context()
	accessToken, user, err := h.service.Login(ctx, req.Login, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
				Error: "invalid credentials",
				Code:  "INVALID_CREDENTIALS",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	refreshToken, err := h.service.CreateRefreshToken(ctx, user.ID)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
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

	validation.RespondJSON(w, http.StatusOK, LoginResponse{
		AccessToken: accessToken,
		User:        user,
	})
}

// Register creates a new user account and logs them in automatically.
// New users have no roles assigned — an administrator grants roles later.
// @Summary Register a new user
// @Description Creates a new user account with the given login and password, then returns access token and sets refresh token cookie. New users have no roles.
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse "Validation failed"
// @Failure 409 {object} ErrorResponse "Login already taken"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	ctx := r.Context()
	accessToken, refreshToken, user, err := h.service.Register(ctx, req.Login, req.Password)
	if err != nil {
		if errors.Is(err, ErrDuplicateLogin) {
			validation.RespondJSON(w, http.StatusConflict, validation.ErrorResponse{
				Error: "login already taken",
				Code:  "DUPLICATE_LOGIN",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
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

	validation.RespondJSON(w, http.StatusOK, LoginResponse{
		AccessToken: accessToken,
		User:        user,
	})
}

// ChangePassword changes the password for the currently authenticated user.
// Does not invalidate existing sessions — re-login is not required.
// @Summary Change password
// @Description Changes the password for the current user. Verifies current password before updating.
// @Tags auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body ChangePasswordRequest true "Current and new password"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Validation failed"
// @Failure 401 {object} ErrorResponse "Current password is incorrect"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/password [post]
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(int)
	if !ok || userID == 0 {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	var req ChangePasswordRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	ctx := r.Context()
	if err := h.service.ChangePassword(ctx, userID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, ErrCurrentPasswordIncorrect) {
			validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
				Error: "current password is incorrect",
				Code:  "CURRENT_PASSWORD_INCORRECT",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateRoles changes roles for a user. Only users with admin role can access this.
// @Summary Update user roles
// @Description Changes roles for a target user. Requires admin role. Roles list can be empty.
// @Tags auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateRolesRequest true "Target login and roles to assign"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid login, roles, or target user not found"
// @Failure 401 {object} ErrorResponse "Not authenticated"
// @Failure 403 {object} ErrorResponse "Admin role required"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/roles [post]
func (h *AuthHandler) UpdateRoles(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(int)
	if !ok || userID == 0 {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	var req UpdateRolesRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	ctx := r.Context()
	if err := h.service.UpdateRoles(ctx, userID, req.Login, req.Roles); err != nil {
		if errors.Is(err, ErrForbidden) {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden",
				Code:  "FORBIDDEN",
			})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
				Error: "user not found",
				Code:  "USER_NOT_FOUND",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
// @Security BearerAuth
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

// DeleteUser deletes the current user account, or a target user (admin only).
// @Summary Delete user
// @Description Deletes the current user. With ?login=target deletes a specific user (admin only).
// @Tags auth
// @Security BearerAuth
// @Param login query string false "Target user login (admin only)"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "User not found or invalid request"
// @Failure 401 {object} ErrorResponse "Not authenticated"
// @Failure 403 {object} ErrorResponse "Forbidden (admin required)"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/auth/user [delete]
func (h *AuthHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(int)
	if !ok || userID == 0 {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	targetLogin := strings.TrimSpace(r.URL.Query().Get("login"))
	if len(targetLogin) > 100 {
		validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
			Error: "Validation failed",
			Code:  "VALIDATION_ERROR",
			Details: []validation.FieldError{
				{Field: "login", Tag: "max", Message: "login query too long"},
			},
		})
		return
	}

	ctx := r.Context()
	if err := h.service.DeleteUser(ctx, userID, targetLogin); err != nil {
		if errors.Is(err, ErrForbidden) {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden",
				Code:  "FORBIDDEN",
			})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
				Error: "user not found",
				Code:  "USER_NOT_FOUND",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
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