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