CREATE TABLE invitation_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash      TEXT NOT NULL UNIQUE,
    created_by      TEXT NOT NULL REFERENCES users(id),
    expires_at      DATETIME NOT NULL,
    used_at         DATETIME,
    used_by_login   TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitation_tokens_token_hash ON invitation_tokens(token_hash);
CREATE INDEX idx_invitation_tokens_expires_at ON invitation_tokens(expires_at);