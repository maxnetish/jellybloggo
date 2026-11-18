package s3config_test

import (
	"context"
	"testing"

	"github.com/maxnetish/jellybloggo/internal/database"
	"github.com/maxnetish/jellybloggo/internal/s3config"
	"github.com/maxnetish/jellybloggo/internal/users"
)

const (
	testEncryptionKey = "0123456789abcdef0123456789abcdef"
	testUserLogin     = "s3owner"
	testUserPassword  = "TestPass1!"
)

type testEnv struct {
	service *s3config.S3ConfigService
	repo    s3config.S3ConfigRepository
	userID  string
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()

	db, err := database.NewInMemory()
	if err != nil {
		t.Fatalf("failed to create in-memory db: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	userRepo := users.NewUserRepository(db)

	user := &users.User{Login: testUserLogin}
	if err := user.SetPassword(testUserPassword); err != nil {
		t.Fatalf("failed to hash test user password: %v", err)
	}
	created, err := userRepo.Create(context.Background(), testUserLogin, user.PasswordHash, nil)
	if err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	repo := s3config.NewS3ConfigRepository(db)
	service, err := s3config.NewS3ConfigService(repo, testEncryptionKey)
	if err != nil {
		t.Fatalf("failed to create s3 config service: %v", err)
	}

	return &testEnv{
		service: service,
		repo:    repo,
		userID:  created.ID,
	}
}

func sampleCreateRequest() s3config.CreateS3ConfigRequest {
	return s3config.CreateS3ConfigRequest{
		ConfigName:       "main",
		S3AccessKey:      "AKIA_TEST_ACCESS_KEY",
		S3AccessSecret:   "test-secret-value",
		S3Bucket:         "my-bucket",
		S3PublicEndPoint: "https://cdn.example.com",
	}
}

// TestCreate_ReturnsPlaintextCredentials guards against POST /api/s3-configs
// returning base64 ciphertext instead of the values the client submitted.
func TestCreate_ReturnsPlaintextCredentials(t *testing.T) {
	env := newTestEnv(t)
	req := sampleCreateRequest()

	config, err := env.service.Create(context.Background(), env.userID, req)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	if config.S3AccessKey != req.S3AccessKey {
		t.Errorf("access key = %q, want plaintext %q", config.S3AccessKey, req.S3AccessKey)
	}
	if config.S3AccessSecret != req.S3AccessSecret {
		t.Errorf("access secret = %q, want plaintext %q", config.S3AccessSecret, req.S3AccessSecret)
	}
	if config.ID == "" {
		t.Error("created config has empty id")
	}
}

// TestCreate_StoresEncryptedCredentials ensures the fix does not start writing
// plaintext credentials into the database.
func TestCreate_StoresEncryptedCredentials(t *testing.T) {
	env := newTestEnv(t)
	req := sampleCreateRequest()

	created, err := env.service.Create(context.Background(), env.userID, req)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	stored, err := env.repo.GetByID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("failed to read stored config: %v", err)
	}
	if stored == nil {
		t.Fatal("stored config not found")
	}
	if stored.S3AccessKey == req.S3AccessKey {
		t.Error("access key is stored in plaintext")
	}
	if stored.S3AccessSecret == req.S3AccessSecret {
		t.Error("access secret is stored in plaintext")
	}

	// The stored ciphertext must round-trip back to the submitted values.
	fetched, err := env.service.GetByID(context.Background(), env.userID, created.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if fetched.S3AccessKey != req.S3AccessKey {
		t.Errorf("decrypted access key = %q, want %q", fetched.S3AccessKey, req.S3AccessKey)
	}
	if fetched.S3AccessSecret != req.S3AccessSecret {
		t.Errorf("decrypted access secret = %q, want %q", fetched.S3AccessSecret, req.S3AccessSecret)
	}
}

// TestUpdate_KeepsCredentialsPlaintextInResponse covers the PUT /api/s3-configs/{id}
// case where credentials are not part of the request: the existing encrypted
// values from the database must be decrypted before responding.
func TestUpdate_KeepsCredentialsPlaintextInResponse(t *testing.T) {
	env := newTestEnv(t)
	req := sampleCreateRequest()

	created, err := env.service.Create(context.Background(), env.userID, req)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	newName := "renamed"
	updated, err := env.service.Update(context.Background(), env.userID, created.ID, s3config.UpdateS3ConfigRequest{
		ConfigName: &newName,
	})
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}

	if updated.ConfigName != newName {
		t.Errorf("config name = %q, want %q", updated.ConfigName, newName)
	}
	if updated.S3AccessKey != req.S3AccessKey {
		t.Errorf("access key = %q, want plaintext %q", updated.S3AccessKey, req.S3AccessKey)
	}
	if updated.S3AccessSecret != req.S3AccessSecret {
		t.Errorf("access secret = %q, want plaintext %q", updated.S3AccessSecret, req.S3AccessSecret)
	}

	stored, err := env.repo.GetByID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("failed to read stored config: %v", err)
	}
	if stored.S3AccessSecret == req.S3AccessSecret {
		t.Error("access secret is stored in plaintext after update")
	}
}

// TestUpdate_ReturnsPlaintextWhenCredentialsChanged verifies that newly
// submitted credentials are returned as plaintext and stored encrypted.
func TestUpdate_ReturnsPlaintextWhenCredentialsChanged(t *testing.T) {
	env := newTestEnv(t)

	created, err := env.service.Create(context.Background(), env.userID, sampleCreateRequest())
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	newKey := "AKIA_NEW_ACCESS_KEY"
	newSecret := "new-secret-value"
	updated, err := env.service.Update(context.Background(), env.userID, created.ID, s3config.UpdateS3ConfigRequest{
		S3AccessKey:    &newKey,
		S3AccessSecret: &newSecret,
	})
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}

	if updated.S3AccessKey != newKey {
		t.Errorf("access key = %q, want plaintext %q", updated.S3AccessKey, newKey)
	}
	if updated.S3AccessSecret != newSecret {
		t.Errorf("access secret = %q, want plaintext %q", updated.S3AccessSecret, newSecret)
	}

	stored, err := env.repo.GetByID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("failed to read stored config: %v", err)
	}
	if stored.S3AccessKey == newKey {
		t.Error("access key is stored in plaintext after update")
	}
	if stored.S3AccessSecret == newSecret {
		t.Error("access secret is stored in plaintext after update")
	}
}

// TestGetByID_NotFoundReturnsNil documents that a missing config is reported as
// (nil, nil), which lets the handler respond with 404 instead of 403.
func TestGetByID_NotFoundReturnsNil(t *testing.T) {
	env := newTestEnv(t)

	config, err := env.service.GetByID(context.Background(), env.userID, "missing-id")
	if err != nil {
		t.Fatalf("GetByID returned error for missing config: %v", err)
	}
	if config != nil {
		t.Fatalf("GetByID returned config for missing id: %+v", config)
	}
}
