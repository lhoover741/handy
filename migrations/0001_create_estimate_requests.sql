CREATE TABLE IF NOT EXISTS estimate_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  area TEXT,
  service TEXT NOT NULL,
  preferred TEXT,
  description TEXT,
  page_url TEXT,
  photos_json TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estimate_requests_created_at
ON estimate_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_estimate_requests_service
ON estimate_requests(service);
