.PHONY: dev build migrate-up migrate-down lint fmt test tidy

dev:
	air

build:
	go build -o bin/server ./cmd/server

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

lint:
	golangci-lint run

fmt:
	gofmt -w .

test:
	go test ./... -v

tidy:
	go mod tidy
