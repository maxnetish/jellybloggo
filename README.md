# Jellybloggo

Платформа для ведения блога с headless CMS и админ-панелью.

| Директория | Назначение |
|-----------|-----------|
| `backend/` | Go API сервер (chi, SQLite, JWT) — см. [backend/README.md](backend/README.md) |
| `frontend/` | Angular SPA с SSR для UI — см. [frontend/README.md](frontend/README.md) |

### Быстрый старт

```bash
# Backend
cd backend
cp .env.example .env    # настроить секреты
just run                # собрать и запустить API на :8080

# Frontend (в отдельном терминале)
cd frontend
npm start               # SSR dev server на :4000
```

### Требования

- Go 1.25+
- Node.js 22+ (для frontend/)
- `just` — команды автоматизации (`brew install just`)
