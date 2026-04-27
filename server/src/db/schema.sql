-- ─── ENUMS ────────────────────────────────────────────────────────────────────
CREATE TYPE entry_source AS ENUM (
  'salary_bonus', 'side_hustle', 'expense_cut',
  'gift', 'quick_save', 'manual', 'other'
);

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                   SERIAL PRIMARY KEY,
  email                VARCHAR(255) UNIQUE NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  name                 VARCHAR(100),
  email_reminders      BOOLEAN DEFAULT TRUE,
  email_monthly_report BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_income     NUMERIC(15,2) CHECK (monthly_income >= 0),
  preferred_currency VARCHAR(10) DEFAULT 'NIS',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXCHANGE RATE SNAPSHOTS (JSONB) ──────────────────────────────────────────
CREATE TABLE exchange_rate_snapshots (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  base_currency VARCHAR(10) NOT NULL,
  rates         JSONB NOT NULL,
  fetched_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exchange_snapshots_user ON exchange_rate_snapshots(user_id, fetched_at DESC);

-- ─── BUDGET CATEGORIES ────────────────────────────────────────────────────────
CREATE TABLE budget_categories (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  monthly_amount NUMERIC(15,2) NOT NULL CHECK (monthly_amount > 0)
);

-- ─── GOALS ────────────────────────────────────────────────────────────────────
CREATE TABLE goals (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  target_amount        NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  initial_amount       NUMERIC(15,2) DEFAULT 0 CHECK (initial_amount >= 0),
  target_date          DATE,
  monthly_contribution NUMERIC(15,2) CHECK (monthly_contribution > 0),
  start_date           DATE DEFAULT CURRENT_DATE,
  currency             VARCHAR(10) DEFAULT 'NIS',
  priority             SMALLINT DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  overflow_goal_id     INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  CONSTRAINT goal_has_target CHECK (target_date IS NOT NULL OR monthly_contribution IS NOT NULL),
  deleted_at           TIMESTAMPTZ DEFAULT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SAVINGS ENTRIES ──────────────────────────────────────────────────────────
CREATE TABLE savings_entries (
  id            SERIAL PRIMARY KEY,
  goal_id       INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  entry_date    DATE NOT NULL,
  note          TEXT,
  source_tag    entry_source DEFAULT 'manual',
  is_quick_save BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_entries_goal_date ON savings_entries(goal_id, entry_date DESC);

-- ─── WITHDRAWALS ──────────────────────────────────────────────────────────────
CREATE TABLE withdrawals (
  id              SERIAL PRIMARY KEY,
  goal_id         INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  reason          TEXT,
  withdrawal_date DATE NOT NULL,
  weeks_added     INTEGER NOT NULL CHECK (weeks_added >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GOAL TRANSFERS ───────────────────────────────────────────────────────────
CREATE TABLE goal_transfers (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  from_goal_id  INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  to_goal_id    INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  withdrawal_id INTEGER REFERENCES withdrawals(id),
  entry_id      INTEGER REFERENCES savings_entries(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GOAL AUDIT LOG ───────────────────────────────────────────────────────────
CREATE TABLE goal_audit_logs (
  id            SERIAL PRIMARY KEY,
  goal_id       INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id),
  field_changed VARCHAR(100) NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-log every UPDATE to goals
CREATE OR REPLACE FUNCTION fn_goal_audit() RETURNS TRIGGER AS $$
DECLARE
  col     TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'name','target_amount','initial_amount','target_date',
    'monthly_contribution','currency','priority','overflow_goal_id'
  ] LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO new_val USING NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO goal_audit_logs(goal_id, user_id, field_changed, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, col, old_val, new_val);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_goal_audit
  AFTER UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION fn_goal_audit();

-- ─── VIEW: GOAL CURRENT STATUS ────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_goal_current_status AS
SELECT
  g.id,
  g.user_id,
  g.name,
  g.target_amount,
  g.target_date,
  g.start_date,
  g.currency,
  g.priority,
  g.overflow_goal_id,
  g.monthly_contribution,
  g.initial_amount
    + COALESCE(e.total_entries, 0)
    - COALESCE(w.total_withdrawn, 0)                       AS total_saved,
  g.target_amount - (
    g.initial_amount
    + COALESCE(e.total_entries, 0)
    - COALESCE(w.total_withdrawn, 0)
  )                                                         AS remaining,
  GREATEST(0, CEIL((g.target_date - CURRENT_DATE) / 7.0)) AS weeks_remaining,
  CEIL((g.target_date - g.start_date) / 30.44)            AS total_months
FROM goals g
LEFT JOIN (
  SELECT goal_id, SUM(amount) AS total_entries
  FROM savings_entries GROUP BY goal_id
) e ON e.goal_id = g.id
LEFT JOIN (
  SELECT goal_id, SUM(amount) AS total_withdrawn
  FROM withdrawals GROUP BY goal_id
) w ON w.goal_id = g.id
WHERE g.deleted_at IS NULL;

-- ─── VIEW: WEEKLY ACTIVITY (feeds heatmap) ────────────────────────────────────
CREATE OR REPLACE VIEW vw_weekly_activity AS
SELECT
  goal_id,
  DATE_TRUNC('week', entry_date)::DATE AS week_start,
  COUNT(*)                             AS entry_count,
  SUM(amount)                          AS week_total
FROM savings_entries
GROUP BY goal_id, DATE_TRUNC('week', entry_date);
