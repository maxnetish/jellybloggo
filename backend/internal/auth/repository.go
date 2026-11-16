package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, userID string, expiresAt time.Time) (string, error)
	GetByToken(ctx context.Context, token string) (*RefreshToken, error)
	DeleteByToken(ctx context.Context, token string) error
	DeleteAllForUser(ctx context.Context, userID string) error
}

type refreshTokenRepository struct {
	db *sql.DB
}

func NewRefreshTokenRepository(db *sql.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

// HashToken returns SHA-256 hash of a token (hex-encoded).
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func (r *refreshTokenRepository) Create(ctx context.Context, userID string, expiresAt time.Time) (string, error) {
	token := fmt.Sprintf("%d:%s:%d", time.Now().UnixNano(), userID, time.Now().Unix())
	tokenHash := HashToken(token)

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
	tokenHash := HashToken(token)

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
	tokenHash := HashToken(token)

	_, err := r.db.ExecContext(ctx,
		"DELETE FROM refresh_tokens WHERE token_hash = ?",
		tokenHash,
	)
	if err != nil {
		return fmt.Errorf("failed to delete refresh token: %w", err)
	}

	return nil
}

func (r *refreshTokenRepository) DeleteAllForUser(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM refresh_tokens WHERE user_id = ?",
		userID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete refresh tokens for user: %w", err)
	}

	return nil
}

// InviteTokenRepository manages invitation tokens.
type InviteTokenRepository interface {
	Create(ctx context.Context, userID string, expiresAt time.Time) (string, error)
	GetByToken(ctx context.Context, token string) (*InviteToken, error)
	MarkAsUsed(ctx context.Context, tokenHash, login string) error
}

type inviteTokenRepository struct {
	db *sql.DB
}

func NewInviteTokenRepository(db *sql.DB) InviteTokenRepository {
	return &inviteTokenRepository{db: db}
}

// generateToken creates a URL-friendly random token (base64url without padding).
func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(b), nil
}

func (r *inviteTokenRepository) Create(ctx context.Context, userID string, expiresAt time.Time) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}
	tokenHash := HashToken(token)

	_, err = r.db.ExecContext(ctx,
		`INSERT INTO invitation_tokens (token_hash, created_by, expires_at) VALUES (?, ?, ?)`,
		tokenHash, userID, expiresAt,
	)
	if err != nil {
		return "", fmt.Errorf("failed to create invitation token: %w", err)
	}

	return token, nil
}

func (r *inviteTokenRepository) GetByToken(ctx context.Context, token string) (*InviteToken, error) {
	tokenHash := HashToken(token)

	it := &InviteToken{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, token_hash, created_by, expires_at, used_at, used_by_login, created_at
		 FROM invitation_tokens WHERE token_hash = ?`,
		tokenHash,
	).Scan(&it.ID, &it.TokenHash, &it.CreatedBy, &it.ExpiresAt, &it.UsedAt, &it.UsedByLogin, &it.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get invitation token: %w", err)
	}

	return it, nil
}

func (r *inviteTokenRepository) MarkAsUsed(ctx context.Context, tokenHash, login string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE invitation_tokens SET used_at = CURRENT_TIMESTAMP, used_by_login = ? WHERE token_hash = ?`,
		login, tokenHash,
	)
	if err != nil {
		return fmt.Errorf("failed to mark invitation token as used: %w", err)
	}
	return nil
}