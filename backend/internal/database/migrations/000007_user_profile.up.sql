ALTER TABLE users ADD COLUMN full_name  TEXT    CHECK (length(full_name) <= 256);
ALTER TABLE users ADD COLUMN birth_date DATE;
ALTER TABLE users ADD COLUMN location   TEXT    CHECK (length(location) <= 256);
ALTER TABLE users ADD COLUMN avatar_url TEXT;
