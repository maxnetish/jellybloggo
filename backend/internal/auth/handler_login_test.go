// Package auth_test holds black-box integration tests for the auth package.
// Using the external `auth_test` package (rather than `auth`) lets us import
// the auth/testutil helper without creating an import cycle.
package auth_test

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/maxnetish/jellybloggo/internal/auth"
	"github.com/maxnetish/jellybloggo/internal/auth/testutil"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

// postJSON sends a POST request with a JSON body to the given URL and returns
// the response. The caller is responsible for closing resp.Body.
func postJSON(t *testing.T, url, body string) *http.Response {
	t.Helper()
	resp, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("POST %s: %v", url, err)
	}
	return resp
}

// assertStatus fails the test if resp.StatusCode != want.
func assertStatus(t *testing.T, resp *http.Response, want int) {
	t.Helper()
	if resp.StatusCode != want {
		body, _ := io.ReadAll(resp.Body)
		_ = resp.Body.Close()
		t.Fatalf("status: want %d, got %d, body=%s", want, resp.StatusCode, string(body))
	}
}

// decodeError reads the response body and unmarshals it as validation.ErrorResponse.
// Fails the test if the body is not valid JSON or does not match the schema.
func decodeError(t *testing.T, resp *http.Response) validation.ErrorResponse {
	t.Helper()
	body, err := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var er validation.ErrorResponse
	if err := json.Unmarshal(body, &er); err != nil {
		t.Fatalf("unmarshal error response: %v, body=%s", err, string(body))
	}
	return er
}

// TestLogin_InvalidJSON verifies that malformed JSON in the request body
// produces a 400 INVALID_JSON response.
func TestLogin_InvalidJSON(t *testing.T) {
	server := testutil.NewAuthTestServer(t)

	resp := postJSON(t, server.URL+"/login", `{not json}`)
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != validation.CodeInvalidJSON {
		t.Errorf("code: want %q, got %q", validation.CodeInvalidJSON, er.Code)
	}
}

// TestLogin_ValidationErrors verifies that each kind of DTO validation
// failure produces a 400 VALIDATION_ERROR with the offending field listed
// in Details.
func TestLogin_ValidationErrors(t *testing.T) {
	server := testutil.NewAuthTestServer(t)

	cases := []struct {
		name      string
		body      string
		wantField string
	}{
		{
			name:      "empty login",
			body:      `{"login":"","password":"TestPass1!"}`,
			wantField: "login",
		},
		{
			name:      "empty password",
			body:      `{"login":"testuser","password":""}`,
			wantField: "password",
		},
		{
			name:      "short password",
			body:      `{"login":"testuser","password":"x"}`,
			wantField: "password",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp := postJSON(t, server.URL+"/login", tc.body)
			assertStatus(t, resp, http.StatusBadRequest)

			er := decodeError(t, resp)
			if er.Code != validation.CodeValidation {
				t.Errorf("code: want %q, got %q", validation.CodeValidation, er.Code)
			}

			found := false
			for _, d := range er.Details {
				if d.Field == tc.wantField {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("Details: want field %q, got %+v", tc.wantField, er.Details)
			}
		})
	}
}

// TestLogin_UnknownUser verifies that a non-existent login produces 401
// INVALID_CREDENTIALS (we do not leak account existence).
func TestLogin_UnknownUser(t *testing.T) {
	server := testutil.NewAuthTestServer(t)

	resp := postJSON(t, server.URL+"/login",
		`{"login":"nobody","password":"TestPass1!"}`)
	assertStatus(t, resp, http.StatusUnauthorized)

	er := decodeError(t, resp)
	if er.Code != "INVALID_CREDENTIALS" {
		t.Errorf("code: want %q, got %q", "INVALID_CREDENTIALS", er.Code)
	}
}

// TestLogin_WrongPassword verifies that a valid login with a wrong password
// produces 401 INVALID_CREDENTIALS.
func TestLogin_WrongPassword(t *testing.T) {
	server := testutil.NewAuthTestServer(t)

	resp := postJSON(t, server.URL+"/login",
		`{"login":"testuser","password":"WrongPass1!"}`)
	assertStatus(t, resp, http.StatusUnauthorized)

	er := decodeError(t, resp)
	if er.Code != "INVALID_CREDENTIALS" {
		t.Errorf("code: want %q, got %q", "INVALID_CREDENTIALS", er.Code)
	}
}

// TestLogin_Success verifies that valid credentials produce a 200 response
// with a user body and the two expected authentication cookies.
func TestLogin_Success(t *testing.T) {
	server := testutil.NewAuthTestServer(t)

	resp := postJSON(t, server.URL+"/login",
		`{"login":"testuser","password":"TestPass1!"}`)
	assertStatus(t, resp, http.StatusOK)

	// Body must contain a user with the correct login.
	body, err := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var lr auth.LoginResponse
	if err := json.Unmarshal(body, &lr); err != nil {
		t.Fatalf("unmarshal login response: %v, body=%s", err, string(body))
	}
	if lr.User == nil {
		t.Fatalf("login response: user is nil, body=%s", string(body))
	}
	if lr.User.Login != testutil.TestUserLogin {
		t.Errorf("user.login: want %q, got %q", testutil.TestUserLogin, lr.User.Login)
	}

	// Both auth cookies must be set.
	cookies := resp.Cookies()
	var hasRefresh, hasAccess bool
	for _, c := range cookies {
		switch c.Name {
		case auth.RefreshTokenCookie:
			hasRefresh = true
			if c.Value == "" {
				t.Errorf("refresh_token cookie has empty value")
			}
		case auth.AccessTokenCookie:
			hasAccess = true
			if c.Value == "" {
				t.Errorf("access_token cookie has empty value")
			}
		}
	}
	if !hasRefresh {
		t.Errorf("response is missing %q cookie, got %+v", auth.RefreshTokenCookie, cookies)
	}
	if !hasAccess {
		t.Errorf("response is missing %q cookie, got %+v", auth.AccessTokenCookie, cookies)
	}
}
