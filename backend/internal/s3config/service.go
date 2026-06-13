package s3config

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"

	"github.com/maxnetish/jellybloggo/internal/users"
)

var (
	ErrEncryptFailed    = errors.New("encryption failed")
	ErrDecryptFailed    = errors.New("decryption failed")
	ErrNotAuthorized    = errors.New("not authorized to access this config")
)

type S3ConfigService struct {
	repo      S3ConfigRepository
	key       []byte
	idGen     func() string
}

func NewS3ConfigService(repo S3ConfigRepository, encryptionKey string) (*S3ConfigService, error) {
	key, err := deriveKey(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to derive encryption key: %w", err)
	}

	return &S3ConfigService{
		repo:  repo,
		key:   key,
		idGen: users.GenerateID,
	}, nil
}

func (s *S3ConfigService) Create(ctx context.Context, userID string, req CreateS3ConfigRequest) (*S3Config, error) {
	encryptedSecret, err := s.encrypt(req.S3AccessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt secret: %w", err)
	}

	encryptedAccessKey, err := s.encrypt(req.S3AccessKey)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt access key: %w", err)
	}

	config := &S3Config{
		ID:               s.idGen(),
		UserID:           userID,
		ConfigName:       req.ConfigName,
		S3AccessKey:      encryptedAccessKey,
		S3AccessSecret:   encryptedSecret,
		S3Endpoint:       req.S3Endpoint,
		S3Region:         req.S3Region,
		S3Bucket:         req.S3Bucket,
		S3PublicEndPoint: req.S3PublicEndPoint,
	}

	return s.repo.Create(ctx, config)
}

func (s *S3ConfigService) GetByID(ctx context.Context, userID, configID string) (*S3Config, error) {
	config, err := s.repo.GetByIDAndUserID(ctx, configID, userID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, ErrNotAuthorized
	}

	decryptedKey, err := s.decrypt(config.S3AccessKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt access key: %w", err)
	}
	config.S3AccessKey = decryptedKey

	decryptedSecret, err := s.decrypt(config.S3AccessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt secret: %w", err)
	}
	config.S3AccessSecret = decryptedSecret

	return config, nil
}

func (s *S3ConfigService) ListByUserID(ctx context.Context, userID string) ([]*S3Config, error) {
	configs, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for _, config := range configs {
		decryptedKey, err := s.decrypt(config.S3AccessKey)
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt access key: %w", err)
		}
		config.S3AccessKey = decryptedKey

		decryptedSecret, err := s.decrypt(config.S3AccessSecret)
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt secret: %w", err)
		}
		config.S3AccessSecret = decryptedSecret
	}

	return configs, nil
}

func (s *S3ConfigService) Update(ctx context.Context, userID, configID string, req UpdateS3ConfigRequest) (*S3Config, error) {
	config, err := s.repo.GetByIDAndUserID(ctx, configID, userID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, ErrNotAuthorized
	}

if req.ConfigName != nil {
		config.ConfigName = *req.ConfigName
	}
	if req.S3Endpoint != nil {
		config.S3Endpoint = req.S3Endpoint
	}
	if req.S3Region != nil {
		config.S3Region = req.S3Region
	}
	if req.S3Bucket != nil {
		config.S3Bucket = *req.S3Bucket
	}
	if req.S3PublicEndPoint != nil {
		config.S3PublicEndPoint = *req.S3PublicEndPoint
	}

	if req.S3AccessKey != nil {
		encryptedKey, err := s.encrypt(*req.S3AccessKey)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt access key: %w", err)
		}
		config.S3AccessKey = encryptedKey
	}

	if req.S3AccessSecret != nil {
		encryptedSecret, err := s.encrypt(*req.S3AccessSecret)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt secret: %w", err)
		}
		config.S3AccessSecret = encryptedSecret
	}

	return s.repo.Update(ctx, config)
}

func (s *S3ConfigService) Delete(ctx context.Context, userID, configID string) error {
	config, err := s.repo.GetByIDAndUserID(ctx, configID, userID)
	if err != nil {
		return err
	}
	if config == nil {
		return ErrNotAuthorized
	}

	return s.repo.Delete(ctx, configID)
}

func (s *S3ConfigService) encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrEncryptFailed, err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrEncryptFailed, err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("%w: %v", ErrEncryptFailed, err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *S3ConfigService) decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("%w: failed to decode base64: %v", ErrDecryptFailed, err)
	}

	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptFailed, err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptFailed, err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("%w: ciphertext too short", ErrDecryptFailed)
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptFailed, err)
	}

	return string(plaintext), nil
}

func deriveKey(password string) ([]byte, error) {
	key := make([]byte, 32)
	copy(key, []byte(password))
	if len(password) < 32 {
		for i := len(password); i < 32; i++ {
			key[i] = 0
		}
	}
	return key[:32], nil
}