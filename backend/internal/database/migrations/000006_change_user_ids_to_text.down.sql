PRAGMA foreign_keys = off;

-- posts
CREATE TABLE posts_new (
    id             TEXT    NOT NULL PRIMARY KEY,
    owner_id       INTEGER NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author         TEXT,
    status         TEXT    NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    visibility     TEXT    NOT NULL CHECK (visibility IN ('public', 'registered', 'private')) DEFAULT 'private',
    thumbnail_url  TEXT,
    slug           TEXT    NOT NULL UNIQUE,
    title          TEXT    NOT NULL,
    annotation     TEXT,
    content        TEXT    NOT NULL,
    content_type   TEXT    NOT NULL CHECK (content_type IN ('html', 'md')) DEFAULT 'md',
    attachments    TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO posts_new SELECT * FROM posts;
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_owner_id ON posts(owner_id);

-- refresh_tokens
CREATE TABLE refresh_tokens_new (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT    NOT NULL UNIQUE,
    user_id    INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO refresh_tokens_new (id, token_hash, user_id, expires_at, created_at)
    SELECT id, token_hash, CAST(user_id AS INTEGER), expires_at, created_at FROM refresh_tokens;
DROP TABLE refresh_tokens;
ALTER TABLE refresh_tokens_new RENAME TO refresh_tokens;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- user_roles
CREATE TABLE user_roles_new (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
INSERT INTO user_roles_new (user_id, role_id)
    SELECT CAST(user_id AS INTEGER), role_id FROM user_roles;
DROP TABLE user_roles;
ALTER TABLE user_roles_new RENAME TO user_roles;

-- users
CREATE TABLE users_new (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    login         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users_new (id, login, password_hash, created_at, updated_at)
    SELECT CAST(id AS INTEGER), login, password_hash, created_at, updated_at FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

PRAGMA foreign_keys = on;
