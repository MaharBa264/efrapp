-- Legacy rows retain their recorded quantity as units. Their weight remains unknown.
ALTER TABLE dispatch_items ADD COLUMN units_count INTEGER;
ALTER TABLE dispatch_items ADD COLUMN weight_kg REAL;
UPDATE dispatch_items SET units_count = CASE WHEN quantity = CAST(quantity AS INTEGER) THEN CAST(quantity AS INTEGER) ELSE NULL END;
