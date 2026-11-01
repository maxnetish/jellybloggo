package auth

import (
	"time"

	"github.com/maxnetish/jellybloggo/internal/types"
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

// UpdateProfileRequest — тело PATCH /api/auth/user.
// Все поля опциональные. Клиент шлёт только те поля, которые хочет изменить.
// Pointer-типы нужны, чтобы отличить "поле не прислано" (nil) от "прислано значение" (non-nil).
// Указатель nil означает: "не менять эту колонку". Указатель non-nil — обновить на значение.
// Явный null в JSON ({"full_name": null}) Go парсит в nil pointer, поэтому
// он тоже трактуется как "не менять". Это сделано специально, чтобы упростить
// UI-логику: пустое поле формы просто не включается в DTO.
type UpdateProfileRequest struct {
	// Полное имя пользователя.
	// Необязательное. Максимум 256 символов.
	FullName *string `json:"full_name,omitempty" v8:"omitempty,max=256"`
	// Дата рождения в формате YYYY-MM-DD.
	// Необязательное. JSON-парсер Go проверяет формат; некорректные значения дают 400.
	BirthDate *types.Date `json:"birth_date,omitempty"`
	// Местоположение пользователя.
	// Необязательное. Максимум 256 символов.
	Location *string `json:"location,omitempty" v8:"omitempty,max=256"`
	// URL аватара.
	// Необязательное. Должен быть валидным URL. Максимум 500 символов.
	AvatarURL *string `json:"avatar_url,omitempty" v8:"omitempty,url,max=500"`
	// Краткая биография ("О себе").
	// Необязательное. Максимум 4096 символов.
	About *string `json:"about,omitempty" v8:"omitempty,max=4096"`
}

// LoginResponse возвращает полную форму пользователя (users.UserResponse,
// как у GET /api/auth/user): у users.User профильные поля скрыты тегами
// json:"-", и клиент после логина недополучал бы full_name и т.п.
type LoginResponse struct {
	User *users.UserResponse `json:"user"`
}

// RefreshResponse возвращает полную форму пользователя (см. LoginResponse).
type RefreshResponse struct {
	User *users.UserResponse `json:"user"`
}

type UserResponse struct {
	User *users.UserResponse `json:"user"`
}

type ErrorResponse = validation.ErrorResponse

type RefreshToken struct {
	ID        int64
	TokenHash string
	UserID    string
	ExpiresAt time.Time
	CreatedAt time.Time
}