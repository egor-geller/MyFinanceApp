import cron from 'node-cron';
import { pool } from '../db/index.js';
import { sendEmail } from '../services/mailer.js';

export function startWeeklyReminder(): void {
  // Every Friday at 18:00
  cron.schedule('0 18 * * 5', async () => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.email, u.name
        FROM users u
        WHERE u.email_reminders = TRUE
          AND EXISTS (
            SELECT 1 FROM goals g WHERE g.user_id = u.id AND g.deleted_at IS NULL
          )
          AND NOT EXISTS (
            SELECT 1 FROM savings_entries se
            JOIN goals g ON g.id = se.goal_id
            WHERE g.user_id = u.id
              AND se.entry_date >= DATE_TRUNC('week', CURRENT_DATE)
          )
      `);

      for (const user of result.rows) {
        await sendEmail(
          user.email,
          'Weekend Check-in — Log your savings!',
          `<h2>Hi ${user.name ?? 'there'}!</h2>
           <p>You haven't logged any savings this week yet. Take a minute to record your progress.</p>
           <p>Every NIS counts — small wins add up!</p>`
        );
      }
    } catch (err) {
      console.error('Weekly reminder job failed:', err);
    }
  });
}
