package auth_test

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/maxnetish/jellybloggo/internal/auth"
	"github.com/maxnetish/jellybloggo/internal/auth/testutil"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

// Helpers (postJSON, assertStatus, decodeError) are defined in handler_login_test.go.
// They are package-level unexported symbols shared across all auth_test files.

// --- Invite Tests ---

// TestInvite_Unauthorized verifies that POST /api/auth/invite without auth returns 401.
func TestInvite_Unauthorized(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)

	resp, err := http.Post(ts.URL()+"/invite", "application/json", nil)
	if err != nil {
		t.Fatalf("POST /api/auth/invite: %v", err)
	}
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusUnauthorized)
}

// TestInvite_NonAdminForbidden verifies that a non-admin user gets 403.
func TestInvite_NonAdminForbidden(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)

	// Login as regular user (no admin role).
	body := `{"login":"` + testutil.TestUserLogin + `","password":"` + testutil.TestUserPassword + `"}`
	loginResp, err := http.Post(ts.URL()+"/login", "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	defer loginResp.Body.Close()
	cookies := loginResp.Cookies()

	// Try to create invite.
	req, _ := http.NewRequest("POST", ts.URL()+"/invite", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp, err := ts.Server.Client().Do(req)
	if err != nil {
		t.Fatalf("invite request: %v", err)
	}
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusForbidden)
}

// TestInvite_Success verifies that an admin can create an invitation token.
func TestInvite_Success(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)

	// Use the admin session cookies for the invite request.
	req, _ := http.NewRequest("POST", session.URL()+"/invite", nil)
	for _, c := range session.Cookies {
		req.AddCookie(c)
	}
	resp, err := session.Server.Client().Do(req)
	if err != nil {
		t.Fatalf("POST /api/auth/invite: %v", err)
	}
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusOK)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}

	var result testutil.InviteTokenResponse
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("decode response: %v, body=%s", err, string(body))
	}

	if result.Token == "" {
		t.Error("token: expected non-empty string")
	}
	if len(result.Token) < 20 {
		t.Errorf("token: expected at least 20 chars, got %d", len(result.Token))
	}
	if result.ExpiresAt.Before(time.Now()) {
		t.Errorf("expires_at: expected future time, got %v", result.ExpiresAt)
	}
	// Should be roughly 24 hours from now.
	if result.ExpiresAt.Before(time.Now().Add(23 * time.Hour)) {
		t.Errorf("expires_at: expected at least 23h from now, got %v", result.ExpiresAt)
	}
}

// --- Register Tests ---

// TestRegister_MissingInvitationToken verifies that a request without invitation_token fails validation.
func TestRegister_MissingInvitationToken(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)

	// Without invitation_token, validation should fail.
	body := `{"login":"newuser","password":"TestPass1!"}`
	resp := postJSON(t, ts.URL()+"/register", body)
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != validation.CodeValidation {
		t.Errorf("code: want %q, got %q", validation.CodeValidation, er.Code)
	}
}

// TestRegister_InvalidInvitationToken verifies that an invalid token returns INVALID_INVITE_TOKEN.
func TestRegister_InvalidInvitationToken(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)

	body := `{"login":"newuser","password":"TestPass1!","invitation_token":"not-a-valid-token"}`
	resp := postJSON(t, ts.URL()+"/register", body)
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != "INVALID_INVITE_TOKEN" {
		t.Errorf("code: want %q, got %q", "INVALID_INVITE_TOKEN", er.Code)
	}
}

// TestRegister_ValidTokenSuccess verifies registration with a valid invitation token.
func TestRegister_ValidTokenSuccess(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	token := session.CreateInvite(t)

	// Register with the token.
	regBody := `{"login":"newuser","password":"TestPass1!","invitation_token":"` + token + `"}`
	resp, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("POST /api/auth/register: %v", err)
	}
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusOK)

	// Verify user response.
	body, _ := io.ReadAll(resp.Body)
	var lr auth.LoginResponse
	if err := json.Unmarshal(body, &lr); err != nil {
		t.Fatalf("unmarshal response: %v, body=%s", err, string(body))
	}
	if lr.User == nil {
		t.Fatal("user: expected non-nil")
	}
	if lr.User.Login != "newuser" {
		t.Errorf("login: want %q, got %q", "newuser", lr.User.Login)
	}
	if len(lr.User.Roles) != 0 {
		t.Errorf("roles: expected empty, got %v", lr.User.Roles)
	}

	// Cookies must be set.
	cookies := resp.Cookies()
	var hasRefresh, hasAccess bool
	for _, c := range cookies {
		if c.Name == auth.RefreshTokenCookie {
			hasRefresh = true
		}
		if c.Name == auth.AccessTokenCookie {
			hasAccess = true
		}
	}
	if !hasRefresh {
		t.Error("missing refresh_token cookie")
	}
	if !hasAccess {
		t.Error("missing access_token cookie")
	}
}

// TestRegister_TokenUsedOnce verifies that a token cannot be used twice.
func TestRegister_TokenUsedOnce(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	token := session.CreateInvite(t)

	// First registration succeeds.
	regBody := `{"login":"user1","password":"TestPass1!","invitation_token":"` + token + `"}`
	resp, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("first registration: %v", err)
	}
	resp.Body.Close()
	// Drain body.
	_, _ = io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("first registration: expected 200, got %d", resp.StatusCode)
	}

	// Second registration with same token fails.
	regBody2 := `{"login":"user2","password":"TestPass1!","invitation_token":"` + token + `"}`
	resp2, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody2))
	if err != nil {
		t.Fatalf("second registration: %v", err)
	}
	defer resp2.Body.Close()
	assertStatus(t, resp2, http.StatusBadRequest)

	er := decodeError(t, resp2)
	if er.Code != "INVITE_TOKEN_USED" {
		t.Errorf("code: want %q, got %q", "INVITE_TOKEN_USED", er.Code)
	}
}

// TestRegister_DuplicateLogin verifies that a duplicate login still returns 409 even with a valid token.
func TestRegister_DuplicateLogin(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	token := session.CreateInvite(t)

	// First registration.
	regBody := `{"login":"dupuser","password":"TestPass1!","invitation_token":"` + token + `"}`
	resp, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("first registration: %v", err)
	}
	resp.Body.Close()
	_, _ = io.ReadAll(resp.Body)

	// Second registration with same login but new token.
	token2 := session.CreateInvite(t)
	regBody2 := `{"login":"dupuser","password":"TestPass1!","invitation_token":"` + token2 + `"}`
	resp2, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody2))
	if err != nil {
		t.Fatalf("second registration: %v", err)
	}
	defer resp2.Body.Close()
	assertStatus(t, resp2, http.StatusConflict)

	er := decodeError(t, resp2)
	if er.Code != "DUPLICATE_LOGIN" {
		t.Errorf("code: want %q, got %q", "DUPLICATE_LOGIN", er.Code)
	}
}

// TestRegister_PasswordValidation verifies that password validation still works with invitation token.
func TestRegister_PasswordValidation(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	token := session.CreateInvite(t)

	// Too short password.
	regBody := `{"login":"newuser","password":"weak","invitation_token":"` + token + `"}`
	resp, err := http.Post(session.URL()+"/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("POST /api/auth/register: %v", err)
	}
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != validation.CodeValidation {
		t.Errorf("code: want %q, got %q", validation.CodeValidation, er.Code)
	}
}

// TestRegister_ExpiredToken verifies that an expired token returns INVITE_TOKEN_EXPIRED.
// Skipped in integration tests since we can't manipulate time. Covered by unit tests.
func TestRegister_ExpiredToken(t *testing.T) {
	t.Skip("integration test for expired token requires time manipulation; covered by unit tests")
}