import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, name } = req.body;
    try {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, hash, name]
      );
      const user = result.rows[0];
      // create empty profile row
      await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as '7d',
      });
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password } = req.body;
    try {
      const result = await pool.query(
        'SELECT id, email, name, password_hash, email_reminders, email_monthly_report FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as '7d',
      });
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, email_reminders, email_monthly_report, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
