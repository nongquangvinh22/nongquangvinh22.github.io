CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready'))
);

CREATE INDEX IF NOT EXISTS idx_uploads_expiry ON uploads(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(status, created_at);
