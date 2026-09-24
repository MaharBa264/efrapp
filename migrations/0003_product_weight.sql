-- Weight belongs to the catalog product. Existing weights cannot be inferred.
ALTER TABLE products ADD COLUMN weight_kg REAL;
-- Preserve the product's weight per unit alongside the dispatched total weight.
ALTER TABLE dispatch_items ADD COLUMN weight_per_unit_kg REAL;
