import { Router, Response } from 'express';
import multer from 'multer';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { parseBankCsv } from '../services/csvParser.js';

const router = Router();
router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/transactions', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  try {
    const categoriesRes = await pool.query(
      'SELECT name, monthly_amount FROM budget_categories WHERE user_id = $1', [req.user!.id]
    );
    const transactions = await parseBankCsv(req.file.buffer.toString('utf-8'));
    const suggestions = transactions.map((t) => {
      const matched = categoriesRes.rows.find((c) =>
        t.description.toLowerCase().includes(c.name.toLowerCase())
      );
      return {
        ...t,
        matched_category: matched?.name ?? null,
        could_save: matched ? Math.min(Number(matched.monthly_amount) * 0.2, t.amount) : null,
      };
    });
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse file' });
  }
});

export default router;
