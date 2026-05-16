set export

swag:
    $(go env GOPATH)/bin/swag init -g cmd/server/main.go -o internal/docs

build: swag
    go build -o bin/server ./cmd/server

run: swag
    go run ./cmd/server

test:
    go test ./...

tidy:
    go mod tidy