// Package testutil provides shared helpers for integration tests of the auth
// package. It lives under internal/auth/testutil to avoid an import cycle:
// helpers need to construct auth.AuthService and auth.NewRouter, while
// auth/*_test.go files want to import the helper.
//
// The helpers spin up real components (router, service, repositories, SQLite
// in-memory DB) so that tests exercise the full request/response pipeline
// without mocking. This catches bugs at SQL, JSON-marshalling, cookie, and
// HTTP-code layers, not just at the unit under test.
package testutil

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/maxnetish/jellybloggo/internal/auth"
	"github.com/maxnetish/jellybloggo/internal/database"
	"github.com/maxnetish/jellybloggo/internal/users"
)

const (
	// TestUserLogin and TestUserPassword are seeded by NewAuthTestServer.
	// Use these constants in tests instead of duplicating string literals.
	TestUserLogin    = "testuser"
	TestUserPassword = "TestPass1!"

	// testJWTSecret is used for signing access tokens in tests.
	// It is intentionally not a real production secret.
	testJWTSecret = "test-secret-not-for-production"

	// testTokenExpiry mirrors the production default for access tokens.
	testTokenExpiry = 15 * time.Minute

	// testRefreshExpiry mirrors the production default for refresh tokens.
	testRefreshExpiry = 7 * 24 * time.Hour
)

// NewAuthTestServer starts an httptest.Server that exposes the /api/auth/*
// router backed by a fresh in-memory SQLite database with all migrations applied.
//
// The DB is seeded with a single user (TestUserLogin / TestUserPassword) and the
// three baseline roles (admin/author/reader) inserted by migration 000001.
//
// Cleanup is registered via t.Cleanup: the httptest.Server and the underlying
// *sql.DB are both closed automatically when the test finishes.
//
// Use this helper from tests in any package that needs to exercise auth handlers
// (login, register, refresh, etc.) end-to-end without external dependencies.
func NewAuthTestServer(t *testing.T) *httptest.Server {
	t.Helper()

	db, err := database.NewInMemory()
	if err != nil {
		t.Fatalf("testutil: failed to create in-memory db: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	userRepo := users.NewUserRepository(db)

	// Hash the password the same way auth.Service.Register does — go through
	// users.User.SetPassword so the helper mirrors production behaviour.
	testUser := &users.User{Login: TestUserLogin}
	if err := testUser.SetPassword(TestUserPassword); err != nil {
		t.Fatalf("testutil: failed to hash test user password: %v", err)
	}
	if _, err := userRepo.Create(context.Background(), TestUserLogin, testUser.PasswordHash, nil); err != nil {
		t.Fatalf("testutil: failed to create test user %q: %v", TestUserLogin, err)
	}

	refreshTokenRepo := auth.NewRefreshTokenRepository(db)
	authService := auth.NewAuthService(userRepo, refreshTokenRepo, auth.AuthConfig{
		JWTSecret:     testJWTSecret,
		TokenExpiry:   testTokenExpiry,
		RefreshExpiry: testRefreshExpiry,
	})

	router := auth.NewRouter(authService, userRepo)

	server := httptest.NewServer(router)
	t.Cleanup(server.Close)
	return server
}
