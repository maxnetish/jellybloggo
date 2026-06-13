# Jellybloggo

A lightweight web server backend built with Go.

## Prerequisites

- [Go](https://go.dev/doc/install) 1.24+
- [just](https://github.com/casey/just#installation)

### Install Go (macOS)

```bash
brew install go
```

### Install just (macOS)

```bash
brew install just
```

## Build

```bash
just build
```

Binary will be created at `bin/server`.

## Run

```bash
just run
```

Server starts on `http://localhost:8080`.

### Environment Variables

Create a `.env` file to configure the application:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./data/jellybloggo.sqlite` | Path to SQLite database file |
| `JWT_SECRET` | `default-secret-change-me` | Secret key for signing JWT access tokens |
| `TOKEN_EXPIRY` | `15m` | Access token lifetime (e.g., `15m`, `1h`) |
| `REFRESH_EXPIRY` | `168h` | Refresh token lifetime (e.g., `168h` = 7 days) |
| `SECURE_COOKIES` | `false` | Set `true` to enable Secure flag on cookies (required for HTTPS) |
| `ADMIN_LOGIN` | — | Initial admin login (creates admin user on startup if role doesn't exist) |
| `ADMIN_PASSWORD` | — | Initial admin password |
| `S3_ENCRYPTION_KEY` | `default-s3-encryption-key-change-me` | 32-byte key for encrypting S3 access keys and secrets at rest |

### Swagger UI

API documentation is available at:

```
http://localhost:8080/swagger/index.html
```

## Test

```bash
just test
```

## Development

### Update dependencies

```bash
just tidy
```

### Available commands

```bash
just --list
```