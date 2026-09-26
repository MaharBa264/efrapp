-- Stock is opt-in. The first enablement starts all presentations at zero.
INSERT INTO settings(key,value) VALUES('stock_enabled','0');
INSERT INTO permissions(name) VALUES('stock.read'),('stock.manage');
INSERT INTO role_permissions(role_id,permission) VALUES('superadmin','stock.read'),('superadmin','stock.manage'),('admin','stock.read'),('admin','stock.manage');
CREATE TABLE stock_levels(product_id TEXT PRIMARY KEY REFERENCES products(id),quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0),minimum INTEGER NOT NULL DEFAULT 0 CHECK(minimum>=0),updated_at TEXT NOT NULL);
INSERT INTO stock_levels(product_id,quantity,minimum,updated_at) SELECT id,0,0,datetime('now') FROM products;
CREATE TABLE stock_movements(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id),delta INTEGER NOT NULL CHECK(delta<>0),kind TEXT NOT NULL CHECK(kind IN ('IN','OUT','ADJUST','DISPATCH_OUT','DISPATCH_VOID')),note TEXT,dispatch_id TEXT REFERENCES dispatches(id),actor_id TEXT NOT NULL REFERENCES users(id),expected_quantity INTEGER,created_at TEXT NOT NULL);
CREATE INDEX stock_movements_product_date ON stock_movements(product_id,created_at DESC);
CREATE UNIQUE INDEX stock_dispatch_once ON stock_movements(dispatch_id,product_id,kind) WHERE dispatch_id IS NOT NULL;
CREATE TRIGGER stock_guard BEFORE INSERT ON stock_movements BEGIN
 SELECT CASE WHEN NEW.kind!='DISPATCH_VOID' AND (SELECT value FROM settings WHERE key='stock_enabled')!='1' THEN RAISE(ABORT,'Stock deshabilitado') END;
 SELECT CASE WHEN NEW.expected_quantity IS NOT NULL AND NEW.expected_quantity!=COALESCE((SELECT quantity FROM stock_levels WHERE product_id=NEW.product_id),0) THEN RAISE(ABORT,'Saldo modificado por otra operación') END;
 SELECT CASE WHEN NEW.delta<0 AND COALESCE((SELECT quantity FROM stock_levels WHERE product_id=NEW.product_id),0)+NEW.delta<0 THEN RAISE(ABORT,'Stock insuficiente') END;
END;
CREATE TRIGGER stock_apply AFTER INSERT ON stock_movements BEGIN
 INSERT INTO stock_levels(product_id,quantity,minimum,updated_at) VALUES(NEW.product_id,0,0,NEW.created_at)
 ON CONFLICT(product_id) DO UPDATE SET quantity=quantity+NEW.delta,updated_at=NEW.created_at;
END;
CREATE TRIGGER stock_new_product AFTER INSERT ON products BEGIN
 INSERT INTO stock_levels(product_id,quantity,minimum,updated_at) VALUES(NEW.id,0,0,datetime('now'));
END;
CREATE TRIGGER stock_dispatch_confirm AFTER UPDATE OF status ON dispatches
 WHEN OLD.status='BORRADOR' AND NEW.status='CONFIRMADO' AND (SELECT value FROM settings WHERE key='stock_enabled')='1'
 BEGIN
 INSERT INTO stock_movements(id,product_id,delta,kind,note,dispatch_id,actor_id,created_at)
 SELECT lower(hex(randomblob(16))),product_id,-units_count,'DISPATCH_OUT',NULL,NEW.id,NEW.confirmed_by,NEW.confirmed_at
 FROM dispatch_items WHERE dispatch_id=NEW.id;
 END;
CREATE TRIGGER stock_dispatch_void AFTER UPDATE OF status ON dispatches
 WHEN OLD.status='CONFIRMADO' AND NEW.status='ANULADO'
 BEGIN
 INSERT INTO stock_movements(id,product_id,delta,kind,note,dispatch_id,actor_id,created_at)
 SELECT lower(hex(randomblob(16))),m.product_id,-m.delta,'DISPATCH_VOID',NULL,NEW.id,NEW.voided_by,NEW.voided_at
 FROM stock_movements m WHERE m.dispatch_id=NEW.id AND m.kind='DISPATCH_OUT';
 END;
