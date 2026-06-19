-- ============================================================================
-- NEXUS SUPPLY — PostgreSQL schema (ADBMS showcase)
-- Demonstrates: LIST partitioning, triggers, ACID-ready tables.
-- Idempotent: safe to run multiple times (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PARTITIONED: warehouses by region (LIST partitioning)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    capacity INTEGER DEFAULT 10000,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE IF NOT EXISTS warehouses_north   PARTITION OF warehouses FOR VALUES IN ('NORTH');
CREATE TABLE IF NOT EXISTS warehouses_south   PARTITION OF warehouses FOR VALUES IN ('SOUTH');
CREATE TABLE IF NOT EXISTS warehouses_east    PARTITION OF warehouses FOR VALUES IN ('EAST');
CREATE TABLE IF NOT EXISTS warehouses_west    PARTITION OF warehouses FOR VALUES IN ('WEST');
CREATE TABLE IF NOT EXISTS warehouses_central PARTITION OF warehouses FOR VALUES IN ('CENTRAL');

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(200),
    contact_phone VARCHAR(20),
    reliability_score DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- PARTITIONED: inventory by warehouse_region (LIST partitioning)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    warehouse_region VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id, warehouse_region)
) PARTITION BY LIST (warehouse_region);

CREATE TABLE IF NOT EXISTS inventory_north   PARTITION OF inventory FOR VALUES IN ('NORTH');
CREATE TABLE IF NOT EXISTS inventory_south   PARTITION OF inventory FOR VALUES IN ('SOUTH');
CREATE TABLE IF NOT EXISTS inventory_east    PARTITION OF inventory FOR VALUES IN ('EAST');
CREATE TABLE IF NOT EXISTS inventory_west    PARTITION OF inventory FOR VALUES IN ('WEST');
CREATE TABLE IF NOT EXISTS inventory_central PARTITION OF inventory FOR VALUES IN ('CENTRAL');

-- Helpful index for the SELECT ... FOR UPDATE lookups used by batch update.
CREATE INDEX IF NOT EXISTS idx_inventory_prod_wh ON inventory (product_id, warehouse_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    total_amount DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    warehouse_id INTEGER NOT NULL,
    warehouse_region VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- ---------------------------------------------------------------------------
-- Low stock alerts (populated by triggers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL,
    warehouse_region VARCHAR(50),
    current_quantity INTEGER,
    threshold INTEGER,
    alert_status VARCHAR(20) DEFAULT 'ACTIVE',
    triggered_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Only one ACTIVE alert per (product, warehouse) so the trigger's ON CONFLICT works.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_alert
    ON low_stock_alerts (product_id, warehouse_id)
    WHERE alert_status = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- Transaction log (ADBMS demonstration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_log (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50),
    status VARCHAR(20),
    affected_records INTEGER,
    error_message TEXT,
    duration_ms INTEGER,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- App users (JWT auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- TRIGGER 1: auto-create a low-stock alert after any quantity update.
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= (
        SELECT low_stock_threshold FROM products WHERE id = NEW.product_id
    ) THEN
        INSERT INTO low_stock_alerts (product_id, warehouse_id, warehouse_region, current_quantity, threshold)
        SELECT NEW.product_id, NEW.warehouse_id, NEW.warehouse_region, NEW.quantity, p.low_stock_threshold
        FROM products p WHERE p.id = NEW.product_id
        ON CONFLICT (product_id, warehouse_id) WHERE (alert_status = 'ACTIVE')
        DO UPDATE SET current_quantity = EXCLUDED.current_quantity,
                      triggered_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_low_stock_trigger ON inventory;
CREATE TRIGGER inventory_low_stock_trigger
AFTER UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- TRIGGER 2: auto-resolve alert once stock rises back above threshold.
CREATE OR REPLACE FUNCTION resolve_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity > (
        SELECT low_stock_threshold FROM products WHERE id = NEW.product_id
    ) THEN
        UPDATE low_stock_alerts
        SET alert_status = 'RESOLVED', resolved_at = NOW()
        WHERE product_id = NEW.product_id
          AND warehouse_id = NEW.warehouse_id
          AND alert_status = 'ACTIVE';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_resolve_alert_trigger ON inventory;
CREATE TRIGGER inventory_resolve_alert_trigger
AFTER UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION resolve_low_stock_alert();

-- TRIGGER 3: keep last_updated fresh on every inventory change.
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_timestamp_trigger ON inventory;
CREATE TRIGGER inventory_timestamp_trigger
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_timestamp();
