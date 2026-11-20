CREATE TABLE IF NOT EXISTS daily_usage (
  ip_hash TEXT NOT NULL,
  day_key TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  bytes_reserved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_day ON daily_usage(day_key);
