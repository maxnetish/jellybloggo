package health

import (
	"encoding/json"
	"net/http"
)

// Handler возвращает статус сервера.
// Используется для проверки работоспособности (load balancer, мониторинг).
// @Summary Health check
// @Description Возвращает статус работоспособности сервера
// @Tags health
// @Produce json
// @Success 200 {object} Response
// @Router /health [get]
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{Status: "ok"})
}

// Response структура ответа health check.
// В будущем можно расширить: uptime, версия, использование памяти, etc.
type Response struct {
	Status string `json:"status"`
}