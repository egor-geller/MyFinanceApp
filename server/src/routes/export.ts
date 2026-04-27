import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import { pool } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

const labels = {
  en: {
    entriesSheet: 'Savings Entries',
    withdrawalsSheet: 'Withdrawals',
    date: 'Date',
    amount: 'Amount',
    source: 'Source',
    note: 'Note',
    quickSave: 'Quick Save',
    withdrawalDate: 'Date',
    reason: 'Reason',
    weeksAdded: 'Weeks Added',
  },
  he: {
    entriesSheet: 'רשומות חיסכון',
    withdrawalsSheet: 'משיכות',
    date: 'תאריך',
    amount: 'סכום',
    source: 'מקור',
    note: 'הערה',
    quickSave: 'חיסכון מהיר',
    withdrawalDate: 'תאריך',
    reason: 'סיבה',
    weeksAdded: 'שבועות נוספו',
  },
};

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerCheck = await pool.query(
      'SELECT name FROM goals WHERE id = $1 AND user_id = $2', [req.params.goalId, req.user!.id]
    );
    if (!ownerCheck.rows.length) { res.status(404).json({ error: 'Not found' }); return; }

    const [entriesRes, withdrawalsRes] = await Promise.all([
      pool.query('SELECT * FROM savings_entries WHERE goal_id = $1 ORDER BY entry_date', [req.params.goalId]),
      pool.query('SELECT * FROM withdrawals WHERE goal_id = $1 ORDER BY withdrawal_date', [req.params.goalId]),
    ]);

    const lang = req.query.lang === 'he' ? 'he' : 'en';
    const l = labels[lang];

    const wb = new ExcelJS.Workbook();
    const entriesSheet = wb.addWorksheet(l.entriesSheet);
    entriesSheet.columns = [
      { header: l.date, key: 'entry_date', width: 14 },
      { header: l.amount, key: 'amount', width: 12 },
      { header: l.source, key: 'source_tag', width: 16 },
      { header: l.note, key: 'note', width: 30 },
      { header: l.quickSave, key: 'is_quick_save', width: 12 },
    ];
    entriesSheet.addRows(entriesRes.rows);

    const wSheet = wb.addWorksheet(l.withdrawalsSheet);
    wSheet.columns = [
      { header: l.withdrawalDate, key: 'withdrawal_date', width: 14 },
      { header: l.amount, key: 'amount', width: 12 },
      { header: l.reason, key: 'reason', width: 30 },
      { header: l.weeksAdded, key: 'weeks_added', width: 14 },
    ];
    wSheet.addRows(withdrawalsRes.rows);

    const goalName = ownerCheck.rows[0].name.replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${goalName}_export.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
