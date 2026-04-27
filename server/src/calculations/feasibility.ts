export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETE' | 'OVERDUE' | 'HIGH_PRESSURE';

export interface Milestone {
  pct: 25 | 50 | 75 | 100;
  reached: boolean;
  date_reached: string | null;
}

export interface Suggestion {
  type: string;
  params?: Record<string, number | string>;
}

export interface FeasibilityResult {
  total_saved: number;
  remaining: number;
  weeks_remaining: number;
  required_weekly: number;
  required_monthly: number;
  avg_weekly_actual: number;
  missed_weeks: number;
  catchup_weekly: number;
  streak_weeks: number;
  status: GoalStatus;
  milestones: Milestone[];
  chart_data: { date: string; actual: number; required: number }[];
  heatmap_data: { date: string; count: number }[];
  suggestions: Suggestion[];
}

interface Entry {
  amount: number;
  entry_date: string;
}

interface GoalRow {
  target_amount: number;
  initial_amount: number;
  target_date: string | null;
  start_date: string;
}

interface ProfileRow {
  monthly_income: number | null;
}

interface CategoryRow {
  monthly_amount: number;
}

export function computeFeasibility(
  goal: GoalRow,
  entries: Entry[],
  totalWithdrawn: number,
  profile: ProfileRow | null,
  categories: CategoryRow[]
): FeasibilityResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = goal.target_date ? new Date(goal.target_date) : null;
  const startDate = new Date(goal.start_date);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  const entriesTotal = entries.reduce((s, e) => s + Number(e.amount), 0);
  const total_saved = Number(goal.initial_amount) + entriesTotal - totalWithdrawn;
  const target = Number(goal.target_amount);
  const remaining = Math.max(0, target - total_saved);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks_remaining = targetDate
    ? Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / msPerWeek))
    : 0;

  const weeks_elapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / msPerWeek));
  const avg_weekly_actual = entriesTotal / weeks_elapsed;

  const required_weekly = weeks_remaining > 0 ? remaining / weeks_remaining : 0;
  const required_monthly = required_weekly * (52 / 12);
  const catchup_weekly = required_weekly;

  // Streak: consecutive weeks with at least one entry up to today
  const weekSet = new Set(
    entries.map((e) => {
      const d = new Date(e.entry_date);
      d.setHours(0, 0, 0, 0);
      return Math.floor(d.getTime() / msPerWeek);
    })
  );
  let streak_weeks = 0;
  const currentWeek = Math.floor(today.getTime() / msPerWeek);
  for (let w = currentWeek; weekSet.has(w); w--) streak_weeks++;

  // Missed weeks
  const expected_by_now = required_weekly * weeks_elapsed;
  const missed_weeks = Math.max(
    0,
    Math.floor((expected_by_now - entriesTotal) / (required_weekly || 1))
  );

  // Status
  let status: GoalStatus;
  const totalExpenses = categories.reduce((s, c) => s + Number(c.monthly_amount), 0);
  const income = profile?.monthly_income ? Number(profile.monthly_income) : null;

  if (total_saved >= target) {
    status = 'COMPLETE';
  } else if (targetDate && today > targetDate) {
    status = 'OVERDUE';
  } else if (income !== null && required_monthly > (income - totalExpenses) * 0.8) {
    status = 'HIGH_PRESSURE';
  } else if (avg_weekly_actual >= required_weekly * 0.9) {
    status = 'ON_TRACK';
  } else if (avg_weekly_actual >= required_weekly * 0.5) {
    status = 'AT_RISK';
  } else {
    status = 'OFF_TRACK';
  }

  // Milestones
  const milestones: Milestone[] = ([25, 50, 75, 100] as const).map((pct) => {
    const threshold = target * pct / 100;
    let cumulative = Number(goal.initial_amount);
    let date_reached: string | null = null;
    for (const e of sortedEntries) {
      cumulative += Number(e.amount);
      if (cumulative >= threshold) {
        date_reached = e.entry_date;
        break;
      }
    }
    return { pct, reached: total_saved >= threshold, date_reached };
  });

  // Chart data: weekly points from start to target_date
  const chart_data: { date: string; actual: number; required: number }[] = [];
  if (targetDate) {
    const totalWeeks =
      Math.ceil((targetDate.getTime() - startDate.getTime()) / msPerWeek) + 1;
    let cumActual = Number(goal.initial_amount);
    let ei = 0;
    for (let w = 0; w <= totalWeeks; w++) {
      const weekDate = new Date(startDate.getTime() + w * msPerWeek);
      while (ei < sortedEntries.length && new Date(sortedEntries[ei].entry_date) <= weekDate) {
        cumActual += Number(sortedEntries[ei].amount);
        ei++;
      }
      const required_at_week = Number(goal.initial_amount) + (target - Number(goal.initial_amount)) * (w / totalWeeks);
      chart_data.push({
        date: weekDate.toISOString().split('T')[0],
        actual: Math.round(cumActual * 100) / 100,
        required: Math.round(required_at_week * 100) / 100,
      });
    }
  }

  // Heatmap data
  const weekCounts = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.entry_date);
    d.setHours(0, 0, 0, 0);
    const weekStart = new Date(d.getTime() - d.getDay() * 24 * 60 * 60 * 1000);
    const key = weekStart.toISOString().split('T')[0];
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }
  const heatmap_data = Array.from(weekCounts.entries()).map(([date, count]) => ({ date, count }));

  // Suggestions (structured — translated on the frontend)
  const suggestions: Suggestion[] = [];
  if (status === 'COMPLETE') {
    suggestions.push({ type: 'COMPLETE' });
  } else if (status === 'OVERDUE') {
    suggestions.push({ type: 'OVERDUE' });
  } else if (status === 'ON_TRACK') {
    const daysEarly = weeks_remaining > 0
      ? Math.round((avg_weekly_actual - required_weekly) / required_weekly * weeks_remaining * 7)
      : 0;
    suggestions.push(daysEarly > 0
      ? { type: 'ON_TRACK_EARLY', params: { daysEarly } }
      : { type: 'ON_TRACK' });
  } else if (status === 'HIGH_PRESSURE') {
    suggestions.push({ type: 'HIGH_PRESSURE', params: { required_monthly: Math.round(required_monthly) } });
  } else if (status === 'AT_RISK') {
    suggestions.push({ type: 'AT_RISK', params: { gap: Math.round(required_weekly - avg_weekly_actual) } });
  } else if (status === 'OFF_TRACK') {
    const weeksNeeded = Math.ceil(remaining / (avg_weekly_actual || required_weekly * 0.5));
    const extendWeeks = Math.max(0, weeksNeeded - weeks_remaining);
    suggestions.push({ type: 'OFF_TRACK', params: { required_weekly: Math.round(required_weekly), extendWeeks } });
  }
  if (weeks_remaining > 0 && weeks_remaining < 4 && status !== 'COMPLETE') {
    suggestions.push({ type: 'DEADLINE_SOON', params: { weeks_remaining, required_weekly: Math.round(required_weekly) } });
  }

  return {
    total_saved,
    remaining,
    weeks_remaining,
    required_weekly,
    required_monthly,
    avg_weekly_actual,
    missed_weeks,
    catchup_weekly,
    streak_weeks,
    status,
    milestones,
    chart_data,
    heatmap_data,
    suggestions,
  };
}
