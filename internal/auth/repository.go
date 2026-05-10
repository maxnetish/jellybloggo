package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, userID int, expiresAt time.Time) (string, error)
	GetByToken(ctx context.Context, token string) (*RefreshToken, error)
	DeleteByToken(ctx context.Context, token string) error
	DeleteAllForUser(ctx context.Context, userID int) error
}

type refreshTokenRepository struct {
	db *sql.DB
}

func NewRefreshTokenRepository(db *sql.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func (r *refreshTokenRepository) Create(ctx context.Context, userID int, expiresAt time.Time) (string, error) {
	token := fmt.Sprintf("%d.%d.%d", time.Now().UnixNano(), userID, time.Now().Unix())
	tokenHash := hashToken(token)

	_, err := r.db.ExecContext(ctx,
		"INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
		tokenHash, userID, expiresAt,
	)
	if err != nil {
		return "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	return token, nil
}

func (r *refreshTokenRepository) GetByToken(ctx context.Context, token string) (*RefreshToken, error) {
	tokenHash := hashToken(token)

	rt := &RefreshToken{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, token_hash, user_id, expires_at, created_at FROM refresh_tokens WHERE token_hash = ?",
		tokenHash,
	).Scan(&rt.ID, &rt.TokenHash, &rt.UserID, &rt.ExpiresAt, &rt.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh token: %w", err)
	}

	return rt, nil
}

func (r *refreshTokenRepository) DeleteByToken(ctx context.Context, token string) error {
	tokenHash := hashToken(token)

	_, err := r.db.ExecContext(ctx,
		"DELETE FROM refresh_tokens WHERE token_hash = ?",
		tokenHash,
	)
	if err != nil {
		return fmt.Errorf("failed to delete refresh token: %w", err)
	}

	return nil
}

func (r *refreshTokenRepository) DeleteAllForUser(ctx context.Context, userID int) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM refresh_tokens WHERE user_id = ?",
		userID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete refresh tokens for user: %w", err)
	}

	return nil
}