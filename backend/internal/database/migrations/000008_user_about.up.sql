ALTER TABLE users ADD COLUMN about TEXT CHECK (length(about) <= 4096);
