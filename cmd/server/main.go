package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os/signal"
	"syscall"
)

func main() {
	// Создаём новый HTTP-сервер с явно заданными параметрами
	// Это нужно, чтобы потом вызвать Shutdown()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// http.Server содержит настройки сервера и обработчик (mux)
	srv := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Запускаем сервер в отдельной горутине (async)
	// Без go он бы заблокировал main() и мы бы не дошли до waitSignal
	go func() {
		log.Println("Server starting on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			// ErrServerClosed - нормальная ошибка при shutdown, её не логируем
			log.Printf("Server error: %v", err)
		}
	}()

	// Создаём канал для получения сигналов ОС
	// signal.NotifyContext создаёт context, который отменяется при получении сигнала
	// syscall.SIGINT = Ctrl+C, syscall.SIGTERM = kill
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Блокируемся, пока не придёт сигнал (ctx отменится)
	<-ctx.Done()
	log.Println("Shutdown signal received")

	// Создаём контекст с таймаутом для graceful shutdown
	// shutdownCtx будет отменён через 5 секунд, если сервер не завершится сам
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*1e9) // 5 секунд в наносекундах
	defer cancel()

	// Shutdown корректно завершает сервер:
	// - Перестаёт принимать новые соединения
	// - Дожидается завершения текущих запросов
	// - Закрывает слушающий сокет
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited gracefully")
}