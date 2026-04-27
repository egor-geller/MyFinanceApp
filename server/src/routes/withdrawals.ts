import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post(
  '/',
  [
    body('amount').isFloat({ gt: 0 }),
    body('withdrawal_date').isISO8601(),
    body('reason').optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const ownerCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.goalId, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }

    const { amount, withdrawal_date, reason } = req.body;
    try {
      const viewRes = await pool.query(
        'SELECT remaining, weeks_remaining FROM vw_goal_current_status WHERE id = $1',
        [req.params.goalId]
      );
      const { remaining, weeks_remaining } = viewRes.rows[0] ?? { remaining: 0, weeks_remaining: 0 };
      const required_weekly = weeks_remaining > 0 ? (Number(remaining) + Number(amount)) / weeks_remaining : 0;
      const weeks_added = required_weekly > 0 ? Math.ceil(Number(amount) / required_weekly) : 0;

      const result = await pool.query(
        `INSERT INTO withdrawals (goal_id, amount, reason, withdrawal_date, weeks_added)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.params.goalId, amount, reason ?? null, withdrawal_date, weeks_added]
      );
      res.status(201).json({ ...result.rows[0], weeks_added });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
