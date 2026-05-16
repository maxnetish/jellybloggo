# Jellybloggo

Платформа для ведения блога с headless CMS и админ-панелью.

| Директория | Назначение |
|-----------|-----------|
| `backend/` | Go API сервер (chi, SQLite, JWT) — см. [backend/README.md](backend/README.md) |
| `admin/` | Angular SPA для администрирования |

### Быстрый старт

```bash
cd backend
cp .env.example .env    # настроить секреты
just run                # собрать и запустить API на :8080
```

### Требования

- Go 1.25+
- Node.js 22+ (для admin/)
- `just` — команды автоматизации (`brew install just`)
