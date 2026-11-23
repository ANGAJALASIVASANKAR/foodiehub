-- Invalidate all outstanding JWTs after password resets/changes
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
