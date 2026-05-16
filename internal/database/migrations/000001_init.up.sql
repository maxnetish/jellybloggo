CREATE TABLE IF NOT EXISTS users (
    id            TEXT    NOT NULL PRIMARY KEY,
    login         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name) VALUES ('admin'), ('author'), ('reader');