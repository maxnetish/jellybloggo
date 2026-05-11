package auth

import (
	"time"

	"github.com/maxnetish/jellybloggo/internal/users"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

// LoginRequest is validated using the "v8" tag (see internal/validation).
// We use a custom tag name to prevent swaggo from generating OpenAPI
// constraints that would block request sending in Swagger UI.
type LoginRequest struct {
	// User login (email or username).
	// Required.
	Login string `json:"login" v8:"required"`
	// User password.
	// Required. Minimum 8 characters.
	Password string `json:"password" v8:"required,min=8"`
}

// RegisterRequest is used for user registration.
// New users have no roles — roles are assigned by an administrator later.
type RegisterRequest struct {
	// User login. Must be unique.
	// Required. Maximum 100 characters.
	Login string `json:"login" v8:"required,max=100"`
	// User password.
	// Required. Must be at least 8 characters and contain uppercase, lowercase, digit, and special character. Maximum 128 characters.
	Password string `json:"password" v8:"required,passwd,max=128"`
}

// ChangePasswordRequest is used to change the current user's password.
type ChangePasswordRequest struct {
	// Current password for verification.
	// Required. Maximum 128 characters.
	CurrentPassword string `json:"current_password" v8:"required,max=128"`
	// New password.
	// Required. Must be at least 8 characters and contain uppercase, lowercase, digit, and special character. Maximum 128 characters.
	NewPassword string `json:"new_password" v8:"required,passwd,max=128"`
}

// UpdateRolesRequest is used by an admin to change roles for a user.
// Roles list can be empty to remove all roles.
type UpdateRolesRequest struct {
	// Target user login. Must exist.
	// Required.
	Login string `json:"login" v8:"required"`
	// Role names to assign. Each must be one of: admin, author, reader.
	// Can be empty to remove all roles.
	Roles []string `json:"roles" v8:"dive,oneof=admin author reader"`
}

type LoginResponse struct {
	AccessToken string       `json:"access_token"`
	User        *users.User  `json:"user"`
}

type RefreshResponse struct {
	AccessToken string       `json:"access_token"`
	User        *users.User  `json:"user"`
}

type UserResponse struct {
	User *users.User `json:"user"`
}

type ErrorResponse = validation.ErrorResponse

type RefreshToken struct {
	ID        int64
	TokenHash string
	UserID    int
	ExpiresAt time.Time
	CreatedAt time.Time
}