package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/maxnetish/jellybloggo/internal/users"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrRefreshTokenExpired = errors.New("refresh token expired")
	ErrRefreshTokenInvalid = errors.New("invalid refresh token")
	ErrDuplicateLogin           = errors.New("login already taken")
	ErrCurrentPasswordIncorrect = errors.New("current password is incorrect")
	ErrForbidden                = errors.New("forbidden")
	ErrUserNotFound             = errors.New("user not found")
)

type AuthService struct {
	userRepo       users.UserRepository
	refreshTokenRepo RefreshTokenRepository
	jwtSecret      []byte
	tokenExpiry    time.Duration
	refreshExpiry  time.Duration
}

type AuthConfig struct {
	JWTSecret     string
	TokenExpiry   time.Duration
	RefreshExpiry time.Duration
}

func NewAuthService(
	userRepo users.UserRepository,
	refreshTokenRepo RefreshTokenRepository,
	cfg AuthConfig,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtSecret:      []byte(cfg.JWTSecret),
		tokenExpiry:    cfg.TokenExpiry,
		refreshExpiry:  cfg.RefreshExpiry,
	}
}

func (s *AuthService) Login(ctx context.Context, login, password string) (string, *users.User, error) {
	user, err := s.userRepo.GetByLogin(ctx, login)
	if err != nil {
		return "", nil, ErrInvalidCredentials
	}
	if user == nil {
		return "", nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", nil, ErrInvalidCredentials
	}

	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, user, nil
}

func (s *AuthService) Register(ctx context.Context, login, password string) (string, string, *users.User, error) {
	existing, _ := s.userRepo.GetByLogin(ctx, login)
	if existing != nil {
		return "", "", nil, ErrDuplicateLogin
	}

	user := &users.User{Login: login}
	if err := user.SetPassword(password); err != nil {
		return "", "", nil, fmt.Errorf("failed to hash password: %w", err)
	}

	created, err := s.userRepo.Create(ctx, login, user.PasswordHash, []string{})
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to create user: %w", err)
	}

	accessToken, err := s.generateAccessToken(created)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.CreateRefreshToken(ctx, created.ID)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, created, nil
}

func (s *AuthService) CreateRefreshToken(ctx context.Context, userID string) (string, error) {
	expiresAt := time.Now().Add(s.refreshExpiry)
	return s.refreshTokenRepo.Create(ctx, userID, expiresAt)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (string, *users.User, error) {
	stored, err := s.refreshTokenRepo.GetByToken(ctx, refreshToken)
	if err != nil {
		return "", nil, err
	}
	if stored == nil {
		return "", nil, ErrRefreshTokenInvalid
	}

	if time.Now().After(stored.ExpiresAt) {
		s.refreshTokenRepo.DeleteByToken(ctx, refreshToken)
		return "", nil, ErrRefreshTokenExpired
	}

	if err := s.refreshTokenRepo.DeleteByToken(ctx, refreshToken); err != nil {
		return "", nil, fmt.Errorf("failed to delete old refresh token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, stored.UserID)
	if err != nil || user == nil {
		return "", nil, fmt.Errorf("failed to get user: %w", err)
	}

	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, user, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	return s.refreshTokenRepo.DeleteByToken(ctx, refreshToken)
}

func (s *AuthService) InvalidateUserSessions(ctx context.Context, userID string) error {
	return s.refreshTokenRepo.DeleteAllForUser(ctx, userID)
}

func (s *AuthService) ChangePassword(ctx context.Context, userID string, currentPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return ErrInvalidCredentials
	}

	if !user.CheckPassword(currentPassword) {
		return ErrCurrentPasswordIncorrect
	}

	if err := user.SetPassword(newPassword); err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, user.PasswordHash); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (s *AuthService) UpdateRoles(ctx context.Context, actorUserID string, targetLogin string, roles []string) error {
	actor, err := s.userRepo.GetByID(ctx, actorUserID)
	if err != nil {
		return fmt.Errorf("failed to get actor: %w", err)
	}
	if actor == nil {
		return ErrInvalidCredentials
	}

	if !actor.HasRole("admin") {
		return ErrForbidden
	}

	target, err := s.userRepo.GetByLogin(ctx, targetLogin)
	if err != nil {
		return ErrUserNotFound
	}
	if target == nil {
		return ErrUserNotFound
	}

	if err := s.userRepo.SetRoles(ctx, target.ID, roles); err != nil {
		return fmt.Errorf("failed to set roles: %w", err)
	}

	return nil
}

func (s *AuthService) DeleteUser(ctx context.Context, actorUserID string, targetLogin string) error {
	actor, err := s.userRepo.GetByID(ctx, actorUserID)
	if err != nil {
		return fmt.Errorf("failed to get actor: %w", err)
	}
	if actor == nil {
		return ErrInvalidCredentials
	}

	if targetLogin != "" {
		if !actor.HasRole("admin") {
			return ErrForbidden
		}
		target, err := s.userRepo.GetByLogin(ctx, targetLogin)
		if err != nil {
			return ErrUserNotFound
		}
		if target == nil {
			return ErrUserNotFound
		}
		return s.userRepo.Delete(ctx, target.ID)
	}

	return s.userRepo.Delete(ctx, actorUserID)
}

func (s *AuthService) ValidateAccessToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid claims")
	}

	userID, ok := claims["sub"].(string)
	if !ok {
		return "", fmt.Errorf("missing or invalid sub claim")
	}

	return userID, nil
}

func (s *AuthService) generateAccessToken(user *users.User) (string, error) {
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(s.tokenExpiry).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}