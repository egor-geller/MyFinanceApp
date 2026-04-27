import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { computeFeasibility } from '../calculations/feasibility.js';
import { computeWhatIf, computeCostOfDelay } from '../calculations/simulator.js';
import { computeSavingPaths, computeRecategorization, computeAllocation } from '../calculations/suggestions.js';

const router = Router();
router.use(requireAuth);

// List active goals
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT v.*, g.initial_amount AS g_initial
       FROM vw_goal_current_status v
       JOIN goals g ON g.id = v.id
       WHERE v.user_id = $1
       ORDER BY v.priority ASC, v.weeks_remaining ASC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List archived (soft-deleted) goals
router.get('/archived', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, target_amount, currency, target_date, deleted_at
       FROM goals WHERE user_id = $1 AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Multi-goal extra allocation
router.get('/allocate', async (req: AuthRequest, res: Response): Promise<void> => {
  const extra = parseFloat(req.query.extra as string);
  if (isNaN(extra) || extra <= 0) {
    res.status(400).json({ error: 'extra must be positive number' });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT id, name, priority, weeks_remaining::int, remaining
       FROM vw_goal_current_status WHERE user_id = $1`,
      [req.user!.id]
    );
    res.json(computeAllocation(result.rows, extra));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create goal (smart two-way)
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('target_amount').isFloat({ gt: 0 }),
    body('initial_amount').optional().isFloat({ min: 0 }),
    body('currency').optional().trim(),
    body('priority').optional().isInt({ min: 1, max: 5 }),
    body('target_date').optional().isISO8601(),
    body('monthly_contribution').optional().isFloat({ gt: 0 }),
    body('overflow_goal_id').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    let { name, target_amount, initial_amount = 0, currency = 'NIS', priority = 1,
      target_date, monthly_contribution, overflow_goal_id, start_date } = req.body;

    // Derive missing variable
    if (target_date && !monthly_contribution) {
      const months = Math.max(1,
        (new Date(target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      monthly_contribution = ((target_amount - initial_amount) / months).toFixed(2);
    } else if (monthly_contribution && !target_date) {
      const months = Math.ceil((target_amount - initial_amount) / monthly_contribution);
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      target_date = d.toISOString().split('T')[0];
    }

    if (!target_date && !monthly_contribution) {
      res.status(400).json({ error: 'Provide target_date or monthly_contribution' });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO goals
          (user_id, name, target_amount, initial_amount, target_date, monthly_contribution,
           currency, priority, overflow_goal_id, start_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10::date, CURRENT_DATE))
         RETURNING *`,
        [req.user!.id, name, target_amount, initial_amount, target_date,
          monthly_contribution, currency, priority, overflow_goal_id ?? null, start_date ?? null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get single goal
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update goal (triggers audit log automatically)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = ['name', 'target_amount', 'initial_amount', 'target_date',
    'monthly_contribution', 'currency', 'priority', 'overflow_goal_id'];
  const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
  if (!fields.length) { res.status(400).json({ error: 'No valid fields' }); return; }
  const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
  const values = fields.map((f) => req.body[f]);
  try {
    const result = await pool.query(
      `UPDATE goals SET ${sets} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user!.id, ...values]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft delete
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE goals SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ archived: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Restore archived goal
router.post('/:id/restore', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE goals SET deleted_at = NULL WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ restored: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set overflow goal
router.put('/:id/overflow', async (req: AuthRequest, res: Response): Promise<void> => {
  const { overflow_goal_id } = req.body;
  try {
    await pool.query(
      'UPDATE goals SET overflow_goal_id = $1 WHERE id = $2 AND user_id = $3',
      [overflow_goal_id ?? null, req.params.id, req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Full analysis
router.get('/:id/analysis', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [goalRes, entriesRes, withdrawRes, profileRes, categoriesRes] = await Promise.all([
      pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [req.params.id, req.user!.id]),
      pool.query('SELECT amount, entry_date FROM savings_entries WHERE goal_id = $1 ORDER BY entry_date ASC',
        [req.params.id]),
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE goal_id = $1',
        [req.params.id]),
      pool.query('SELECT monthly_income FROM user_profiles WHERE user_id = $1', [req.user!.id]),
      pool.query('SELECT name, monthly_amount FROM budget_categories WHERE user_id = $1', [req.user!.id]),
    ]);
    if (!goalRes.rows.length) { res.status(404).json({ error: 'Not found' }); return; }

    const goal = goalRes.rows[0];
    const feasibility = computeFeasibility(
      goal, entriesRes.rows, Number(withdrawRes.rows[0].total),
      profileRes.rows[0] ?? null, categoriesRes.rows
    );
    const saving_paths = computeSavingPaths(feasibility.required_weekly, feasibility.remaining);
    const avgMonthly = feasibility.avg_weekly_actual * (52 / 12);
    const catSuggestions = computeRecategorization(
      feasibility.required_monthly - avgMonthly,
      categoriesRes.rows.map((c) => ({ name: c.name, monthly_amount: Number(c.monthly_amount) }))
    );

    res.json({ ...feasibility, saving_paths, suggestions: [...feasibility.suggestions, ...catSuggestions] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// What-if
router.get('/:id/whatif', async (req: AuthRequest, res: Response): Promise<void> => {
  const extra = parseFloat(req.query.extra as string);
  if (isNaN(extra)) { res.status(400).json({ error: 'extra required' }); return; }
  try {
    const viewRes = await pool.query(
      'SELECT remaining, weeks_remaining FROM vw_goal_current_status WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (!viewRes.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const { remaining, weeks_remaining } = viewRes.rows[0];
    const required_weekly = weeks_remaining > 0 ? remaining / weeks_remaining : 0;
    res.json(computeWhatIf(remaining, required_weekly, weeks_remaining, extra));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cost of delay
router.get('/:id/delay', async (req: AuthRequest, res: Response): Promise<void> => {
  const months = parseInt(req.query.months as string);
  if (isNaN(months) || months <= 0) { res.status(400).json({ error: 'months required' }); return; }
  try {
    const viewRes = await pool.query(
      'SELECT target_amount, remaining, weeks_remaining, monthly_contribution FROM vw_goal_current_status WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (!viewRes.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const { target_amount, weeks_remaining, monthly_contribution } = viewRes.rows[0];
    const months_remaining = Math.ceil(weeks_remaining / 4.33);
    res.json(computeCostOfDelay(target_amount, Number(monthly_contribution ?? 0), months_remaining, months));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 24-month projection (recursive CTE)
router.get('/:id/projection', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const viewRes = await pool.query(
      'SELECT total_saved, target_amount, monthly_contribution FROM vw_goal_current_status WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (!viewRes.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const { total_saved, target_amount, monthly_contribution } = viewRes.rows[0];
    const monthly = Number(monthly_contribution ?? 0);

    const result = await pool.query(
      `WITH RECURSIVE months(n, projected_date, projected_total) AS (
        SELECT 1,
               (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
               $1::NUMERIC + $2::NUMERIC
        UNION ALL
        SELECT n + 1,
               (projected_date + INTERVAL '1 month')::DATE,
               projected_total + $2::NUMERIC
        FROM months
        WHERE n < 24 AND projected_total < $3::NUMERIC
      )
      SELECT n, projected_date, LEAST(projected_total, $3::NUMERIC) AS projected_total FROM months`,
      [total_saved, monthly, target_amount]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Transfer between goals (atomic BEGIN/COMMIT)
router.post('/transfer', async (req: AuthRequest, res: Response): Promise<void> => {
  const { from_goal_id, to_goal_id, amount, note } = req.body;
  if (!from_goal_id || !to_goal_id || !amount || amount <= 0) {
    res.status(400).json({ error: 'from_goal_id, to_goal_id, amount required' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership
    const check = await client.query(
      'SELECT id FROM goals WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL',
      [[from_goal_id, to_goal_id], req.user!.id]
    );
    if (check.rows.length < 2) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Goals not found' });
      return;
    }

    const weeksRes = await client.query(
      'SELECT weeks_remaining FROM vw_goal_current_status WHERE id = $1',
      [to_goal_id]
    );
    const weeks_added = Math.ceil(amount / (weeksRes.rows[0]?.weeks_remaining || 1));

    const wRes = await client.query(
      `INSERT INTO withdrawals (goal_id, amount, reason, withdrawal_date, weeks_added)
       VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING id`,
      [from_goal_id, amount, note ?? 'Transfer', 0]
    );
    const eRes = await client.query(
      `INSERT INTO savings_entries (goal_id, amount, entry_date, note, source_tag)
       VALUES ($1, $2, CURRENT_DATE, $3, 'manual') RETURNING id`,
      [to_goal_id, amount, note ?? `Transfer from goal ${from_goal_id}`]
    );
    await client.query(
      `INSERT INTO goal_transfers (user_id, from_goal_id, to_goal_id, amount, note, withdrawal_id, entry_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user!.id, from_goal_id, to_goal_id, amount, note ?? null,
        wRes.rows[0].id, eRes.rows[0].id]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Transfer failed' });
  } finally {
    client.release();
  }
});

// Audit log
router.get('/:id/audit', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const result = await pool.query(
      'SELECT * FROM goal_audit_logs WHERE goal_id = $1 ORDER BY changed_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
