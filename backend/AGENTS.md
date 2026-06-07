# Jellybloggo - Development Guide

## Project Structure

```
jellybloggo/
├── cmd/server/main.go       # Entry point, routing, swagger metadata
├── internal/
│   ├── health/             # Health check endpoint
│   ├── auth/               # Authentication, JWT middleware
│   │   └── README_UI.md   # UI integration notes (auth flow, endpoints)
│   ├── middleware/         # Custom middleware (future)
│   └── docs/              # Swagger generated files
├── bin/                    # Compiled binaries (gitignored)
├── go.mod / go.sum
├── justfile
└── .gitignore
```

## Dependencies

- **chi/v5** - HTTP router
- **chi/middleware** - Logger, Recoverer, RequestID
- **golang-jwt/jwt/v5** - JWT handling
- **swaggo/http-swagger/v2** - Swagger UI
- **swaggo/swag** (dev) - Swagger generator

## Justfile Recipes

| Command | Description |
|---------|-------------|
| `just build` | Generate swagger docs, compile binary to `bin/server` |
| `just run` | Generate swagger docs, run with `go run` |
| `just test` | Run all tests |
| `just tidy` | Clean up dependencies |

**Important:** `swag` binary is installed via `go install` to `$(go env GOPATH)/bin/`.

## Router

Using **chi** router.

- `r.Method(path, handler)` - simple routes
- `r.Route(prefix, fn)` - grouped routes with middleware
- `r.Use(middleware)` - apply middleware to all routes in router

## Code Style

- Short variable names (`w`, `r`, `err`) for standard library types
- Full names for domain-specific types
- Comments in Russian for domain logic, English for technical
- Swagger annotations above handlers: `// @Summary`, `// @Router`, etc.

## API Conventions

- JSON responses with `Content-Type: application/json`
- JWT passed via `Authorization: Bearer <token>` header
- Protected routes mounted under `/api/*`
- All auth endpoints documented in `internal/auth/README_UI.md`

## Frontend Integration

- Backend runs on port **8080** (configurable via `PORT` env)
- Swagger UI available at `/swagger/`
- In development: Express server proxies `/api/*` to backend
- In production: nginx handles routing:
  - Static files served from Angular build
  - `/api/*` proxied to backend on port 8080
  - `/swagger/*` proxied to backend (optional)

## Testing Approach

**End-to-end via chi + SQLite-in-memory.** No mocks for handlers/services/repos.
Each test starts a real `httptest.Server` backed by a fresh in-memory SQLite
database with all migrations applied. This catches bugs at SQL, JSON-marshalling,
cookie, HTTP-status, and middleware layers — not just the unit under test.

### Infrastructure

| File | Purpose |
|------|---------|
| `internal/database/db.go` | `NewInMemory() (*sql.DB, error)` — opens `":memory:?_foreign_keys=on"`, runs all migrations. Caller closes the `*sql.DB`. |
| `internal/auth/testutil/server.go` | `NewAuthTestServer(t *testing.T) *httptest.Server` — wires `database → userRepo → refreshTokenRepo → authService → router`, seeds one test user (`TestUserLogin` / `TestUserPassword`, both exported), starts `httptest.NewServer`, registers `t.Cleanup` for both server and DB. |
| `internal/auth/handler_login_test.go` | Reference test file. Contains reusable unexported helpers: `postJSON`, `assertStatus`, `decodeError`. Copy these into new test files rather than re-creating. |

**Why a sub-package `auth/testutil`?** The helper must import `auth` (to build
`AuthService`, `NewRouter`, etc.), and `auth/*_test.go` files must import the
helper. Putting the helper in `internal/testutil/` would create an import
cycle. The sub-package breaks the cycle: `auth/testutil` depends on `auth`,
and `auth` test binaries (package `auth_test`) depend on `auth/testutil`.

**Test package naming.** Use `package <name>_test` (external/black-box) for
test files that import the helper. Use `package <name>` (internal/white-box)
only when the test must reach unexported symbols. The login tests use
`auth_test`; exported symbols (`auth.RefreshTokenCookie`, `auth.LoginResponse`,
etc.) are accessed via the `auth.` prefix.

### Conventions

- **Real components only.** No `testify/mock`, no hand-rolled fakes, no
  interface extraction just to mock. If a dependency is hard to construct,
  prefer the real implementation in the test setup over a mock.
- **`httptest.NewServer` over `httptest.NewRecorder`.** Real TCP loopback
  exercises the full HTTP stack (cookies, status, content-type negotiation).
  The overhead is negligible (~1s per login-test-suite run).
- **Cleanup via `t.Cleanup`, not `defer`.** `t.Cleanup` runs even on subtest
  failure, and is the idiomatic way to tear down per-test resources.
- **Test user setup mirrors production.** Hash the password through
  `users.User{Login: ...}.SetPassword(...)` — same path as
  `auth.Service.Register`. Never pass a plaintext password to
  `users.UserRepository.Create` (it expects a bcrypt hash).
- **Helpers in the test file itself.** `postJSON`, `assertStatus`,
  `decodeError` are unexported and live next to the tests that use them. Do
  not promote them to a shared package unless 3+ test files need them.
- **Test names describe the case, not the implementation.**
  `TestLogin_WrongPassword`, not `TestLogin_BcryptMismatch`.
- **Use `t.Helper()`** in every helper that calls `t.Fatalf` / `t.Errorf` —
  this makes failure line numbers point at the test, not the helper.
- **Style consistency with `validation_test.go`.** No `testify/assert`,
  `t.Errorf` / `t.Fatalf` directly, English comments for technical details.

### Test Credentials

The `testutil` package exports:

```go
const (
    TestUserLogin    = "testuser"
    TestUserPassword = "TestPass1!"
)
```

Hardcode these in test bodies — don't redefine string literals. The user has
no roles by default; for admin-only tests, either:

- Add a second seeding helper (`testutil.NewAuthTestServerWithAdmin(t)`), or
- Reuse the `userRepo` reference (returned alongside the server) and call
  `SetRoles(ctx, userID, []string{"admin"})` directly in the test.

### Adding Tests for a New Endpoint

1. Create `internal/<package>/handler_<endpoint>_test.go` with
   `package <package>_test`.
2. Import `internal/auth/testutil` if the endpoint lives under `/api/auth/*`
   (or build a sibling helper for other routers, e.g. `users/testutil`).
3. Get the server:
   ```go
   server := testutil.NewAuthTestServer(t) // or the appropriate helper
   ```
4. Drive requests with `http.Post`, `http.NewRequest` + `server.Client().Do`,
   etc. Prefer `http.Post` for one-shot calls.
5. Use the unexported helpers (`postJSON`, `assertStatus`, `decodeError`) —
   copy them from `handler_login_test.go` into the new file. Keep them
   identical across test files.
6. For protected endpoints (JWT required), see the next subsection.

### Protected Endpoints (TODO — not yet implemented)

For routes behind `TransparentRefreshMiddleware` (anything in the `r.Group`
in `auth/routes.go`), the test needs to attach `access_token` (header or
cookie) and/or `refresh_token` (cookie). When the first such test is written,
add a sibling helper to `auth/testutil`:

```go
// NewAuthTestServerWithSession starts a server and logs in the test user,
// returning the cookies the test should send with subsequent requests.
func NewAuthTestServerWithSession(t *testing.T) (*httptest.Server, []*http.Cookie)
```

Attach those cookies to requests via `req.AddCookie(...)` and
`server.Client().Do(req)`. The login response itself is the source of the
cookies (`resp.Cookies()`); call `/api/auth/login` once at setup, then reuse
the cookies.

### Known Noise

`database.runMigrations` logs each applied migration via `log.Printf`, so a
verbose `go test -v` run prints ~8 lines per test setup. Not a correctness
issue. If it gets annoying in CI, redirect logs in `NewInMemory` via
`log.SetOutput(io.Discard)` for the duration of the test (restore on cleanup).
