-- ═══════════════════════════════════════════════════════════════════════════
-- Cashew Business ERP — Full Database Schema
-- Database: cashew_system
-- Run once to initialize all tables. Safe to re-run (uses IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ADMINS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  username   VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','manager','staff') DEFAULT 'staff',
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 2. CUSTOMERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  mobile     VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 3. CATEGORIES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 4. PRODUCTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category_id    INT,
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2) NOT NULL,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ─── 5. SUPPLIERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone          VARCHAR(20),
  email          VARCHAR(150),
  gstin          VARCHAR(20),
  address        TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 6. PURCHASES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id  INT,
  product_id   INT NOT NULL,
  quantity     DECIMAL(10,2) NOT NULL,
  unit_cost    DECIMAL(10,2) NOT NULL,
  total_cost   DECIMAL(12,2) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date  DATE,
  notes        TEXT,
  status       ENUM('ordered','received','partial','returned') DEFAULT 'received',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ─── 7. ORDERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     DECIMAL(10,2) NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status       ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ─── 8. ORDER ITEMS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  line_total  DECIMAL(12,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─── 9. DELIVERIES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_id         INT NOT NULL UNIQUE,
  delivery_address TEXT,
  tracking_number  VARCHAR(100),
  delivery_otp     VARCHAR(10),
  status           ENUM('pending','dispatched','out_for_delivery','delivered','failed') DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ─── 10. RETURNS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  reason         TEXT NOT NULL,
  refund_amount  DECIMAL(12,2) DEFAULT 0,
  refund_note    TEXT,
  status         ENUM('pending','approved','rejected','refunded') DEFAULT 'pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ─── 11. COUPONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(50) NOT NULL UNIQUE,
  discount_type  ENUM('percentage','flat') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order      DECIMAL(10,2),
  max_uses       INT,
  used_count     INT DEFAULT 0,
  expiry_date    DATE,
  active         TINYINT(1) DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 12. BANNERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  image_url  VARCHAR(500),
  link_url   VARCHAR(500),
  position   ENUM('home_top','home_mid','home_bottom','sidebar','popup') DEFAULT 'home_top',
  active     TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 13. REVIEWS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id  INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE
);

-- ─── 14. INVOICES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL UNIQUE,
  subtotal     DECIMAL(12,2) NOT NULL,
  gst_rate     DECIMAL(5,2) DEFAULT 18.00,
  gst_amount   DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ─── 15. AUDIT LOGS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  user_name  VARCHAR(150),
  user_role  VARCHAR(50),
  action     ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
  module     VARCHAR(100),
  details    TEXT,
  ip_address VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SEED: default admin (password: admin123) ─────────────────────────────
-- Run scripts/seedAdmin.js instead to generate a fresh bcrypt hash.
-- This INSERT is provided only as a reference — bcrypt hash below is for
-- the password "admin123" with 12 salt rounds.
-- INSERT IGNORE INTO admins (name, username, password, role)
-- VALUES ('Admin', 'admin', '$2b$12$...your_hash_here...', 'admin');
