-- Password policies (singleton table)
CREATE TABLE IF NOT EXISTS password_policies (
  id                SERIAL PRIMARY KEY,
  min_length        INTEGER DEFAULT 6,
  require_uppercase BOOLEAN DEFAULT false,
  require_number    BOOLEAN DEFAULT false,
  require_symbol    BOOLEAN DEFAULT false,
  expiry_days       INTEGER DEFAULT 0,
  history_count     INTEGER DEFAULT 0,
  max_failed_attempts INTEGER DEFAULT 5,
  lockout_minutes   INTEGER DEFAULT 30,
  updated_at        TIMESTAMP DEFAULT NOW()
);

INSERT INTO password_policies (min_length, require_uppercase, require_number, require_symbol, expiry_days, history_count, max_failed_attempts, lockout_minutes)
SELECT 6, false, false, false, 0, 0, 5, 30
WHERE NOT EXISTS (SELECT 1 FROM password_policies);

-- Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(active) WHERE deleted_at IS NULL;

-- Password history table
CREATE TABLE IF NOT EXISTS password_history (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- ============================================================
-- MODULE & KPI CONFIGURATION
-- ============================================================

CREATE TABLE IF NOT EXISTS modules (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50) UNIQUE NOT NULL,
  label         VARCHAR(100) NOT NULL,
  path          VARCHAR(50) NOT NULL,
  icon          VARCHAR(50) DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  deleted_at    TIMESTAMP,
  maintenance   BOOLEAN DEFAULT false,
  coming_soon   BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS kpis (
  id              SERIAL PRIMARY KEY,
  module_id       INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  label           VARCHAR(200) NOT NULL,
  value_type      VARCHAR(50) DEFAULT 'number',
  default_value   VARCHAR(100) DEFAULT '',
  source_column   VARCHAR(100) DEFAULT '',
  aggregation     VARCHAR(50) DEFAULT 'sum',
  formula         VARCHAR(500) DEFAULT '',
  current_value   VARCHAR(100) DEFAULT '',
  updated_at      TIMESTAMP DEFAULT NOW(),
  sort_order      INTEGER DEFAULT 0,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  deleted_at      TIMESTAMP
);

-- Seed existing modules
INSERT INTO modules (name, label, path, icon, sort_order) VALUES
  ('dashboard',    'Dashboard',       '/',              'LayoutDashboard',   0),
  ('revenue',      'Revenue',         '/revenue',       'CircleDollarSign',  1),
  ('patients',     'Patients',        '/patients',      'Users',             2),
  ('beds',         'Bed Management',  '/beds',          'BedDouble',         3),
  ('lab',          'Lab & Radiology', '/lab',           'Microscope',        4),
  ('pharmacy',     'Pharmacy',        '/pharmacy',      'Pill',              5),
  ('kitchen-diet', 'Kitchen & Diet',  '/kitchen-diet',  'Utensils',          6),
  ('operations',   'Operations',      '/operations',    'Activity',          7),
  ('doctors',      'Doctors Payout',  '/doctors',       'Stethoscope',       8),
  ('nursing',      'Nursing',         '/nursing',       'ClipboardList',     9),
  ('reports',      'Reports',         '/reports',       'FileText',          10),
  ('settings',     'Settings',        '/settings',      'Settings',          11)
ON CONFLICT (name) DO NOTHING;

-- System logs for audit trail
CREATE TABLE IF NOT EXISTS system_logs (
  id         SERIAL PRIMARY KEY,
  level      VARCHAR(20) NOT NULL DEFAULT 'info',
  message    TEXT NOT NULL,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username   VARCHAR(100),
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- ============================================================
-- MULTI-ROLE & CASE-INSENSITIVE USERNAME
-- ============================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Migrate existing single-role users to the new table
INSERT INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;
