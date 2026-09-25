CREATE TABLE salespeople(id TEXT PRIMARY KEY,first_name TEXT NOT NULL,last_name TEXT NOT NULL,whatsapp TEXT,alternate_phone TEXT,email TEXT,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE carriers(id TEXT PRIMARY KEY,first_name TEXT NOT NULL,last_name TEXT NOT NULL,vehicle TEXT NOT NULL,plate TEXT NOT NULL,ownership TEXT NOT NULL CHECK(ownership IN ('PROPIO','TERCERO')),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
ALTER TABLE dispatches ADD COLUMN salesperson_id TEXT REFERENCES salespeople(id);
ALTER TABLE dispatches ADD COLUMN salesperson_name TEXT;
ALTER TABLE dispatches ADD COLUMN carrier_id TEXT REFERENCES carriers(id);
ALTER TABLE dispatches ADD COLUMN carrier_name TEXT;
CREATE INDEX idx_dispatch_salesperson ON dispatches(salesperson_id);
CREATE INDEX idx_dispatch_carrier ON dispatches(carrier_id);
