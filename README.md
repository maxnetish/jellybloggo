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