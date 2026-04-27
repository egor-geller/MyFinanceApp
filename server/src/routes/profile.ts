import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get profile + categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [profileRes, catsRes, userRes] = await Promise.all([
      pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.user!.id]),
      pool.query('SELECT * FROM budget_categories WHERE user_id = $1 ORDER BY id', [req.user!.id]),
      pool.query('SELECT email_reminders, email_monthly_report FROM users WHERE id = $1', [req.user!.id]),
    ]);
    res.json({
      ...profileRes.rows[0],
      ...userRes.rows[0],
      categories: catsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put(
  '/',
  [
    body('monthly_income').optional().isFloat({ min: 0 }),
    body('preferred_currency').optional().trim(),
    body('email_reminders').optional().isBoolean(),
    body('email_monthly_report').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const { monthly_income, preferred_currency, email_reminders, email_monthly_report } = req.body;
    try {
      await pool.query(
        `INSERT INTO user_profiles (user_id, monthly_income, preferred_currency)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET monthly_income = COALESCE($2, user_profiles.monthly_income),
               preferred_currency = COALESCE($3, user_profiles.preferred_currency),
               updated_at = NOW()`,
        [req.user!.id, monthly_income ?? null, preferred_currency ?? null]
      );
      if (email_reminders !== undefined || email_monthly_report !== undefined) {
        const fields: string[] = [];
        const vals: unknown[] = [];
        if (email_reminders !== undefined) { fields.push(`email_reminders = $${vals.length + 2}`); vals.push(email_reminders); }
        if (email_monthly_report !== undefined) { fields.push(`email_monthly_report = $${vals.length + 2}`); vals.push(email_monthly_report); }
        await pool.query(
          `UPDATE users SET ${fields.join(', ')} WHERE id = $1`,
          [req.user!.id, ...vals]
        );
      }
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Add category
router.post(
  '/categories',
  [body('name').trim().notEmpty(), body('monthly_amount').isFloat({ gt: 0 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const { name, monthly_amount } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO budget_categories (user_id, name, monthly_amount) VALUES ($1,$2,$3) RETURNING *',
        [req.user!.id, name, monthly_amount]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update category
router.put('/categories/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, monthly_amount } = req.body;
  try {
    const result = await pool.query(
      'UPDATE budget_categories SET name = COALESCE($1, name), monthly_amount = COALESCE($2, monthly_amount) WHERE id = $3 AND user_id = $4 RETURNING *',
      [name ?? null, monthly_amount ?? null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category
router.delete('/categories/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'DELETE FROM budget_categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
