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