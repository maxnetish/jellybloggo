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