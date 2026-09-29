-- Failed-login throttle and de-duplicated issuer logos for dispatch snapshots.
CREATE TABLE login_attempts(username TEXT PRIMARY KEY,failures INTEGER NOT NULL,window_start TEXT NOT NULL);
CREATE TABLE issuer_logos(id TEXT PRIMARY KEY,data TEXT NOT NULL,created_at TEXT NOT NULL);
