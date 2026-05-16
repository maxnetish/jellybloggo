CREATE TABLE IF NOT EXISTS posts (
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

CREATE TABLE IF NOT EXISTS tags (
    name TEXT NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS post_tags (
    post_id  TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL REFERENCES tags(name) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_owner_id ON posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_name ON post_tags(tag_name);