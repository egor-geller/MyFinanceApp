import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './index.js';

const DEMO_EMAIL = 'demo@financeapp.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_NAME = 'Demo User';

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Upsert demo user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, email_reminders, email_monthly_report)
     VALUES ($1, $2, $3, true, true)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2
     RETURNING id`,
    [DEMO_EMAIL, hash, DEMO_NAME]
  );
  const userId = result.rows[0].id;

  // Upsert profile
  await pool.query(
    `INSERT INTO user_profiles (user_id, monthly_income, preferred_currency)
     VALUES ($1, 8000, 'NIS')
     ON CONFLICT (user_id) DO UPDATE
       SET monthly_income = 8000, preferred_currency = 'NIS'`,
    [userId]
  );

  // Sample budget categories
  await pool.query('DELETE FROM budget_categories WHERE user_id = $1', [userId]);
  await pool.query(
    `INSERT INTO budget_categories (user_id, name, monthly_amount) VALUES
     ($1, 'Dining Out', 800),
     ($1, 'Groceries', 1200),
     ($1, 'Transport', 400),
     ($1, 'Entertainment', 500)`,
    [userId]
  );

  // Sample goals
  await pool.query('UPDATE goals SET deleted_at = NOW() WHERE user_id = $1', [userId]);

  const vacationRes = await pool.query(
    `INSERT INTO goals (user_id, name, target_amount, initial_amount, target_date, monthly_contribution, currency, priority)
     VALUES ($1, 'Vacation Fund', 5000, 500, CURRENT_DATE + INTERVAL '6 months', 750, 'NIS', 1)
     RETURNING id`,
    [userId]
  );
  const laptopRes = await pool.query(
    `INSERT INTO goals (user_id, name, target_amount, initial_amount, target_date, monthly_contribution, currency, priority)
     VALUES ($1, 'New Laptop', 3000, 200, CURRENT_DATE + INTERVAL '4 months', 700, 'NIS', 2)
     RETURNING id`,
    [userId]
  );

  const vacId = vacationRes.rows[0].id;
  const lapId = laptopRes.rows[0].id;

  // Sample savings entries (past 8 weeks)
  for (let w = 8; w >= 1; w--) {
    const d = new Date();
    d.setDate(d.getDate() - w * 7);
    const dateStr = d.toISOString().split('T')[0];
    const vacAmount = 600 + Math.round(Math.random() * 300);
    const lapAmount = 500 + Math.round(Math.random() * 200);
    await pool.query(
      `INSERT INTO savings_entries (goal_id, amount, entry_date, source_tag)
       VALUES ($1, $2, $3, 'manual')`,
      [vacId, vacAmount, dateStr]
    );
    await pool.query(
      `INSERT INTO savings_entries (goal_id, amount, entry_date, source_tag)
       VALUES ($1, $2, $3, 'manual')`,
      [lapId, lapAmount, dateStr]
    );
  }

  console.log(`✓ Demo user created`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
