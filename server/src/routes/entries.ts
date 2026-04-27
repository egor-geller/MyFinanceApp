import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.goalId, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const result = await pool.query(
      'SELECT * FROM savings_entries WHERE goal_id = $1 ORDER BY entry_date DESC',
      [req.params.goalId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post(
  '/',
  [
    body('amount').isFloat({ gt: 0 }),
    body('entry_date').isISO8601(),
    body('note').optional().trim(),
    body('source_tag').optional().isIn(['salary_bonus','side_hustle','expense_cut','gift','quick_save','manual','other']),
    body('is_quick_save').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const ownerCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.goalId, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const { amount, entry_date, note, source_tag = 'manual', is_quick_save = false } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO savings_entries (goal_id, amount, entry_date, note, source_tag, is_quick_save)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.params.goalId, amount, entry_date, note ?? null, source_tag, is_quick_save]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete('/:entryId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2', [req.params.goalId, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const result = await pool.query(
      'DELETE FROM savings_entries WHERE id = $1 AND goal_id = $2 RETURNING id',
      [req.params.entryId, req.params.goalId]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Entry not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
