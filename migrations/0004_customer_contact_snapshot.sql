ALTER TABLE dispatches ADD COLUMN customer_phone TEXT;
ALTER TABLE dispatches ADD COLUMN customer_direction TEXT;
-- Existing dispatches retain a best-effort copy of the current customer contact.
UPDATE dispatches SET customer_phone=(SELECT phone FROM customers WHERE customers.id=dispatches.customer_id),customer_direction=(SELECT direction FROM customers WHERE customers.id=dispatches.customer_id);
