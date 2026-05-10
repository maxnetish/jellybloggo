package auth

import (
	"time"

	"github.com/maxnetish/jellybloggo/internal/users"
)

type LoginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
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

type ErrorResponse struct {
	Error string `json:"error"`
}

type RefreshToken struct {
	ID        int64
	TokenHash string
	UserID    int
	ExpiresAt time.Time
	CreatedAt time.Time
}