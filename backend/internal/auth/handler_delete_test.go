package auth_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/maxnetish/jellybloggo/internal/auth/testutil"
	"github.com/maxnetish/jellybloggo/internal/users"
)

// --- Delete user tests ---
//
// Endpoint contract: DELETE /api/auth/user?login=<login> (admin only).
// Without ?login the actor deletes their own account.
// Invariant: the system must always keep at least one admin (400 LAST_ADMIN).

// doDelete sends a DELETE request with optional session cookies.
func doDelete(t *testing.T, server *httptest.Server, url string, cookies []*http.Cookie) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		t.Fatalf("new DELETE %s: %v", url, err)
	}
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp, err := server.Client().Do(req)
	if err != nil {
		t.Fatalf("DELETE %s: %v", url, err)
	}
	return resp
}

// doPostWithCookies sends a POST request with a JSON body and session cookies.
func doPostWithCookies(t *testing.T, server *httptest.Server, url, body string, cookies []*http.Cookie) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		t.Fatalf("new POST %s: %v", url, err)
	}
	req.Header.Set("Content-Type", "application/json")
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp, err := server.Client().Do(req)
	if err != nil {
		t.Fatalf("POST %s: %v", url, err)
	}
	return resp
}

// createAdmin seeds an extra admin user directly through the repository.
func createAdmin(t *testing.T, repo users.UserRepository, login string) *users.User {
	t.Helper()
	user := &users.User{Login: login}
	if err := user.SetPassword(testutil.TestAdminPassword); err != nil {
		t.Fatalf("hash password for %q: %v", login, err)
	}
	created, err := repo.Create(context.Background(), login, user.PasswordHash, nil)
	if err != nil {
		t.Fatalf("create user %q: %v", login, err)
	}
	if err := repo.SetRoles(context.Background(), created.ID, []string{"admin"}); err != nil {
		t.Fatalf("set admin role for %q: %v", login, err)
	}
	return created
}

// loginAs logs in with the given credentials and returns the session cookies.
func loginAs(t *testing.T, server *httptest.Server, login, password string) []*http.Cookie {
	t.Helper()
	body := `{"login":"` + login + `","password":"` + password + `"}`
	resp := postJSON(t, server.URL+"/login", body)
	assertStatus(t, resp, http.StatusOK)
	defer resp.Body.Close()
	return resp.Cookies()
}

// TestDeleteUser_Unauthorized verifies that DELETE /user without auth returns 401.
func TestDeleteUser_Unauthorized(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)

	resp := doDelete(t, ts.Server, ts.URL()+"/user?login="+testutil.TestUserLogin, nil)
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusUnauthorized)
}

// TestDeleteUser_NonAdminForbidden verifies that a regular user cannot delete another user.
func TestDeleteUser_NonAdminForbidden(t *testing.T) {
	ts := testutil.NewAuthTestServer(t)
	cookies := loginAs(t, ts.Server, testutil.TestUserLogin, testutil.TestUserPassword)

	resp := doDelete(t, ts.Server, ts.URL()+"/user?login="+testutil.TestAdminLogin, cookies)
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusForbidden)
}

// TestDeleteUser_AdminDeletesRegularUser verifies that an admin can delete a
// regular user and that the user is actually gone.
func TestDeleteUser_AdminDeletesRegularUser(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)

	resp := doDelete(t, session.Server, session.URL()+"/user?login="+testutil.TestUserLogin, session.Cookies)
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusNoContent)

	user, err := session.Repo.GetByLogin(context.Background(), testutil.TestUserLogin)
	if err != nil {
		t.Fatalf("GetByLogin after delete: %v", err)
	}
	if user != nil {
		t.Fatalf("user %q still exists after delete", testutil.TestUserLogin)
	}
}

// TestDeleteUser_UnknownUser verifies that deleting a non-existent login
// returns 400 USER_NOT_FOUND.
func TestDeleteUser_UnknownUser(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)

	resp := doDelete(t, session.Server, session.URL()+"/user?login=nobody", session.Cookies)
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != "USER_NOT_FOUND" {
		t.Errorf("code: want %q, got %q", "USER_NOT_FOUND", er.Code)
	}
}

// TestDeleteUser_LastAdminForbidden verifies that the only admin cannot be
// deleted, both by explicit login and by deleting oneself without ?login.
func TestDeleteUser_LastAdminForbidden(t *testing.T) {
	cases := []struct {
		name string
		url  string
	}{
		{name: "by login", url: "/user?login=" + testutil.TestAdminLogin},
		{name: "self", url: "/user"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			session := testutil.NewAuthTestServerWithAdmin(t)

			resp := doDelete(t, session.Server, session.URL()+tc.url, session.Cookies)
			assertStatus(t, resp, http.StatusBadRequest)

			er := decodeError(t, resp)
			if er.Code != "LAST_ADMIN" {
				t.Errorf("code: want %q, got %q", "LAST_ADMIN", er.Code)
			}
			if er.Error != "cannot remove the last admin" {
				t.Errorf("error: want %q, got %q", "cannot remove the last admin", er.Error)
			}

			// Rollback must have restored the admin.
			user, err := session.Repo.GetByLogin(context.Background(), testutil.TestAdminLogin)
			if err != nil {
				t.Fatalf("GetByLogin after rejected delete: %v", err)
			}
			if user == nil {
				t.Fatalf("admin %q was deleted despite LAST_ADMIN", testutil.TestAdminLogin)
			}
			if !user.HasRole("admin") {
				t.Fatalf("admin %q lost the admin role", testutil.TestAdminLogin)
			}
		})
	}
}

// TestDeleteUser_AdminDeletesSelf verifies that an admin can delete their own
// account when another admin remains.
func TestDeleteUser_AdminDeletesSelf(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	createAdmin(t, session.Repo, "testadmin2")

	resp := doDelete(t, session.Server, session.URL()+"/user?login="+testutil.TestAdminLogin, session.Cookies)
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusNoContent)

	user, err := session.Repo.GetByLogin(context.Background(), testutil.TestAdminLogin)
	if err != nil {
		t.Fatalf("GetByLogin after delete: %v", err)
	}
	if user != nil {
		t.Fatalf("admin %q still exists after delete", testutil.TestAdminLogin)
	}
}

// TestUpdateRoles_DemoteLastAdminForbidden verifies that removing the admin
// role from the only admin is rejected and roles stay unchanged.
func TestUpdateRoles_DemoteLastAdminForbidden(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)

	body := `{"login":"` + testutil.TestAdminLogin + `","roles":["reader"]}`
	resp := doPostWithCookies(t, session.Server, session.URL()+"/roles", body, session.Cookies)
	assertStatus(t, resp, http.StatusBadRequest)

	er := decodeError(t, resp)
	if er.Code != "LAST_ADMIN" {
		t.Errorf("code: want %q, got %q", "LAST_ADMIN", er.Code)
	}

	user, err := session.Repo.GetByLogin(context.Background(), testutil.TestAdminLogin)
	if err != nil {
		t.Fatalf("GetByLogin after rejected update: %v", err)
	}
	if user == nil {
		t.Fatalf("admin %q disappeared", testutil.TestAdminLogin)
	}
	if !user.HasRole("admin") {
		t.Fatalf("roles were changed despite LAST_ADMIN: %v", user.Roles)
	}
	if user.HasRole("reader") {
		t.Fatalf("roles were partially applied despite LAST_ADMIN: %v", user.Roles)
	}
}

// TestUpdateRoles_DemoteAdminWithAnotherAdmin verifies that demoting an admin
// is allowed when another admin remains.
func TestUpdateRoles_DemoteAdminWithAnotherAdmin(t *testing.T) {
	session := testutil.NewAuthTestServerWithAdmin(t)
	createAdmin(t, session.Repo, "testadmin2")

	body := `{"login":"` + testutil.TestAdminLogin + `","roles":["reader"]}`
	resp := doPostWithCookies(t, session.Server, session.URL()+"/roles", body, session.Cookies)
	defer resp.Body.Close()
	assertStatus(t, resp, http.StatusNoContent)

	user, err := session.Repo.GetByLogin(context.Background(), testutil.TestAdminLogin)
	if err != nil {
		t.Fatalf("GetByLogin after update: %v", err)
	}
	if user == nil {
		t.Fatalf("admin %q disappeared", testutil.TestAdminLogin)
	}
	if user.HasRole("admin") {
		t.Fatalf("admin role was not removed: %v", user.Roles)
	}
	if !user.HasRole("reader") {
		t.Fatalf("reader role was not assigned: %v", user.Roles)
	}
}
