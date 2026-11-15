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
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
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
	// Password must satisfy the passwd validator: uppercase, lowercase, digit, special char.
	TestUserLogin    = "testuser"
	TestUserPassword = "TestPass1!"

	// TestAdminLogin and TestAdminPassword are seeded by NewAuthTestServerWithAdmin.
	TestAdminLogin    = "testadmin"
	TestAdminPassword = "AdminPass1!"

	// testJWTSecret is used for signing access tokens in tests.
	// It is intentionally not a real production secret.
	testJWTSecret = "test-secret-not-for-production"

	// testTokenExpiry mirrors the production default for access tokens.
	testTokenExpiry = 15 * time.Minute

	// testRefreshExpiry mirrors the production default for refresh tokens.
	testRefreshExpiry = 7 * 24 * time.Hour
)

// TestServer holds the server and its user repository for test use.
type TestServer struct {
	Server  *httptest.Server
	UserRepo users.UserRepository
}

// URL returns the server base URL.
func (t *TestServer) URL() string {
	return t.Server.URL
}

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
func NewAuthTestServer(t *testing.T) *TestServer {
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
	inviteTokenRepo := auth.NewInviteTokenRepository(db)
	authService := auth.NewAuthService(userRepo, refreshTokenRepo, inviteTokenRepo, auth.AuthConfig{
		JWTSecret:     testJWTSecret,
		TokenExpiry:   testTokenExpiry,
		RefreshExpiry: testRefreshExpiry,
	})

	router := auth.NewRouter(authService, userRepo)

	server := httptest.NewServer(router)
	t.Cleanup(server.Close)
	return &TestServer{Server: server, UserRepo: userRepo}
}

// AdminSession holds the server URL and cookies for an authenticated admin session.
type AdminSession struct {
	Server  *httptest.Server
	Cookies []*http.Cookie
	// Repo exposes the underlying user repository so tests can seed extra users
	// (e.g. a second admin) without going through the public API.
	Repo users.UserRepository
}

// URL returns the server base URL.
func (a *AdminSession) URL() string {
	return a.Server.URL
}

// NewAuthTestServerWithAdmin starts a test server with an admin user seeded,
// logs in as that admin, and returns the session cookies for admin requests.
func NewAuthTestServerWithAdmin(t *testing.T) *AdminSession {
	t.Helper()

	ts := NewAuthTestServer(t)

	// Create admin user with admin role.
	adminUser := &users.User{Login: TestAdminLogin}
	if err := adminUser.SetPassword(TestAdminPassword); err != nil {
		t.Fatalf("testutil: failed to hash admin password: %v", err)
	}
	created, err := ts.UserRepo.Create(context.Background(), TestAdminLogin, adminUser.PasswordHash, nil)
	if err != nil {
		t.Fatalf("testutil: failed to create admin user: %v", err)
	}
	if err := ts.UserRepo.SetRoles(context.Background(), created.ID, []string{"admin"}); err != nil {
		t.Fatalf("testutil: failed to set admin role: %v", err)
	}

	// Login as admin.
	loginReq := struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}{TestAdminLogin, TestAdminPassword}

	loginBody, _ := json.Marshal(loginReq)
	resp, err := http.Post(ts.URL()+"/login", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		t.Fatalf("testutil: failed to login as admin: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("testutil: admin login failed: status %d, body=%s", resp.StatusCode, string(body))
	}

	// Drain body.
	_, _ = io.ReadAll(resp.Body)

	cookies := resp.Cookies()
	return &AdminSession{Server: ts.Server, Cookies: cookies, Repo: ts.UserRepo}
}

// InviteTokenResponse mirrors CreateInviteResponse from auth/model.go.
type InviteTokenResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// CreateInvite performs POST /api/auth/invite using the admin session.
func (a *AdminSession) CreateInvite(t *testing.T) string {
	t.Helper()

	req, _ := http.NewRequest("POST", a.Server.URL+"/invite", nil)
	for _, c := range a.Cookies {
		req.AddCookie(c)
	}
	resp, err := a.Server.Client().Do(req)
	if err != nil {
		t.Fatalf("CreateInvite: request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("CreateInvite: expected 200, got %d, body=%s", resp.StatusCode, string(body))
	}

	var result InviteTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("CreateInvite: failed to decode response: %v", err)
	}
	return result.Token
}
