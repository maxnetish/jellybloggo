CREATE TABLE posts_new (
    id             TEXT    NOT NULL PRIMARY KEY,
    owner_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    content_type   TEXT    NOT NULL CHECK (content_type IN ('html', 'md')) DEFAULT 'md'
);

INSERT INTO posts_new SELECT id, owner_id, created_at, updated_at, author, status, visibility, thumbnail_url, slug, title, annotation, content, content_type FROM posts;

DROP TABLE posts;

ALTER TABLE posts_new RENAME TO posts;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_owner_id ON posts(owner_id);