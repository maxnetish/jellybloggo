package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"github.com/maxnetish/jellybloggo/internal/auth"
	"github.com/maxnetish/jellybloggo/internal/database"
	"github.com/maxnetish/jellybloggo/internal/health"
	"github.com/maxnetish/jellybloggo/internal/users"

	_ "github.com/maxnetish/jellybloggo/internal/docs"
)

// @title Jellybloggo API
// @version 1.0
// @description A lightweight web server backend built with Go
// @host localhost:8080
// @BasePath /

var db *sql.DB
var userRepo users.UserRepository

func main() {
	godotenv.Load()

	dsn := os.Getenv("DB_PATH")
	if dsn == "" {
		dsn = "./data/jellybloggo.sqlite"
	}

	var err error
	db, err = database.New(dsn)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	userRepo = users.NewUserRepository(db)

	r := chi.NewRouter()

	// middleware - это функции, которые выполняются ДО или ПОСЛЕ обработчика
	// Они применяются ко ВСЕМ маршрутам в роутере
	// Logger - логирует каждый запрос (метод, путь, статус, время)
	r.Use(middleware.Logger)
	// Recoverer - перехватывает паники и возвращает 500 вместо краша сервера
	r.Use(middleware.Recoverer)
	// RequestID - добавляет уникальный ID к каждому запросу (для трейсинга)
	r.Use(middleware.RequestID)

	// Регистрируем маршруты
	// Простые маршруты регистрируются через r.Method(path, handler)
	r.Get("/health", health.Handler)

	// Mount подключает вложенный роутер по префиксу пути
	// Все запросы к /swagger/* будут обрабатываться httpSwagger
	r.Mount("/swagger", httpSwagger.WrapHandler)

	// Route создаёт подроутер с префиксом /api
	// Все маршруты внутри будут иметь префикс /api
	r.Route("/api", func(r chi.Router) {
		// Use применяет middleware ТОЛЬКО к маршрутам внутри этого Route
		// JWTMiddleware будет выполняться для /api/protected
		r.Use(auth.JWTMiddleware)
		r.Get("/protected", auth.ProtectedHandler)
	})

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}