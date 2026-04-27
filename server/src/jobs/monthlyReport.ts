import cron from 'node-cron';
import { pool } from '../db/index.js';
import { sendEmail } from '../services/mailer.js';

export function startMonthlyReport(): void {
  // 1st of each month at 08:00
  cron.schedule('0 8 1 * *', async () => {
    try {
      const usersRes = await pool.query(
        'SELECT id, email, name FROM users WHERE email_monthly_report = TRUE'
      );

      for (const user of usersRes.rows) {
        const goalsRes = await pool.query(
          `SELECT v.name, v.total_saved, v.target_amount, v.weeks_remaining, v.currency
           FROM vw_goal_current_status v WHERE v.user_id = $1 ORDER BY v.priority`,
          [user.id]
        );

        const savedThisMonth = await pool.query(
          `SELECT COALESCE(SUM(se.amount), 0) AS total
           FROM savings_entries se
           JOIN goals g ON g.id = se.goal_id
           WHERE g.user_id = $1
             AND se.entry_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
             AND se.entry_date < DATE_TRUNC('month', CURRENT_DATE)`,
          [user.id]
        );

        const goalRows = goalsRes.rows
          .map((g) => {
            const pct = Math.min(100, Math.round((Number(g.total_saved) / Number(g.target_amount)) * 100));
            return `<tr>
              <td>${g.name}</td>
              <td>${Number(g.total_saved).toFixed(2)} ${g.currency}</td>
              <td>${Number(g.target_amount).toFixed(2)} ${g.currency}</td>
              <td>${pct}%</td>
              <td>${g.weeks_remaining} weeks left</td>
            </tr>`;
          })
          .join('');

        const html = `
          <h2>Monthly Savings Report — ${user.name ?? user.email}</h2>
          <p>Saved this month: <strong>${Number(savedThisMonth.rows[0].total).toFixed(2)} NIS</strong></p>
          <table border="1" cellpadding="6" style="border-collapse:collapse">
            <thead><tr><th>Goal</th><th>Saved</th><th>Target</th><th>Progress</th><th>Timeline</th></tr></thead>
            <tbody>${goalRows}</tbody>
          </table>
          <p>Keep up the great work!</p>`;

        await sendEmail(user.email, 'Your Monthly Savings Summary', html);
      }
    } catch (err) {
      console.error('Monthly report job failed:', err);
    }
  });
}
