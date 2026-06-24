-- Run this file to initialize the database:
--   psql -U postgres -d kims_dashboard -f schema.sql

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  code   VARCHAR(10) PRIMARY KEY,
  name   VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roles (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50) UNIQUE NOT NULL,
  label         VARCHAR(100) NOT NULL,
  landing_path  VARCHAR(50) DEFAULT '/',
  allowed_paths JSONB DEFAULT '[]'::jsonb,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) DEFAULT '',
  phone         VARCHAR(20) DEFAULT '',
  emp_id        VARCHAR(50) DEFAULT '',
  role_id       INTEGER REFERENCES roles(id),
  allowed_sites JSONB DEFAULT '["PBMH"]'::jsonb,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED ROLES
-- ============================================================

INSERT INTO roles (name, label, landing_path, allowed_paths, active) VALUES
  ('revenue',    'Revenue Department', '/revenue',
   '["/","/revenue","/reports"]'::jsonb, true),
  ('ceo',        'CEO', '/',
   '["/","/revenue","/patients","/beds","/lab","/pharmacy","/kitchen-diet","/operations","/reports"]'::jsonb, true),
  ('admin',      'Admin', '/',
   '["/","/patients","/beds","/lab","/pharmacy","/kitchen-diet","/operations","/reports","/settings"]'::jsonb, true),
  ('superadmin', 'Super Admin', '/',
   '["*"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED SITES
-- ============================================================

INSERT INTO sites (code, name) VALUES
  ('PBMH', 'PBMH Hospital'),
  ('KSSCC', 'KSSCC Hospital')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED USERS  (passwords are bcrypt hashes)
--   superadmin / super@123
--   admin      / admin@123
--   ceo        / ceo@123
--   revenue    / rev@123
--
-- To regenerate hashes for a fresh schema run:
--   node -e "import bcrypt from 'bcrypt'; console.log(await bcrypt.hash('YOUR_PASSWORD', 10))"
-- ============================================================

INSERT INTO users (username, password_hash, name, role_id, allowed_sites, active)
SELECT 'superadmin', '$2b$10$gpAeKTS7z/DpCM8cykoIseA7AeGmYjF5f52Z1z7Hmn21Y6c2G71SW', 'Super Admin', id, '["PBMH","KSSCC"]'::jsonb, true
FROM roles WHERE name = 'superadmin'
AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');

INSERT INTO users (username, password_hash, name, role_id, allowed_sites, active)
SELECT 'admin', '$2b$10$7LIDw9YCxsKGogjDqksAx.MlqPwD//hGTzGo479jIkaTtDUMkOy..', 'Admin User', id, '["PBMH","KSSCC"]'::jsonb, true
FROM roles WHERE name = 'admin'
AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, password_hash, name, role_id, allowed_sites, active)
SELECT 'ceo', '$2b$10$2wPg66KAVWEtl8mryO8mhujBLCkbVEzt14LOPFCWru.VY2ECoR5li', 'CEO User', id, '["PBMH","KSSCC"]'::jsonb, true
FROM roles WHERE name = 'ceo'
AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'ceo');

INSERT INTO users (username, password_hash, name, role_id, allowed_sites, active)
SELECT 'revenue', '$2b$10$CeMbHVWHtClUEnCwnWrJ6OJMWhJDyKXuCNXIsChUVOYWxx6cl8ms2', 'Revenue User', id, '["PBMH"]'::jsonb, true
FROM roles WHERE name = 'revenue'
AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'revenue');
