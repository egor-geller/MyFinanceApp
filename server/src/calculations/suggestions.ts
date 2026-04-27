export interface SavingPath {
  label: 'Conservative' | 'Moderate' | 'Aggressive';
  weekly: number;
  monthly: number;
  target_date: string;
}

export interface AllocationSuggestion {
  goal_id: number;
  name: string;
  suggested_extra: number;
}

export function computeSavingPaths(
  required_weekly: number,
  remaining: number
): SavingPath[] {
  const paths: Array<{ label: SavingPath['label']; multiplier: number }> = [
    { label: 'Conservative', multiplier: 1 },
    { label: 'Moderate', multiplier: 1.2 },
    { label: 'Aggressive', multiplier: 1.5 },
  ];
  return paths.map(({ label, multiplier }) => {
    const weekly = Math.round(required_weekly * multiplier * 100) / 100;
    const monthly = Math.round(weekly * (52 / 12) * 100) / 100;
    const weeksNeeded = weekly > 0 ? Math.ceil(remaining / weekly) : 0;
    const d = new Date();
    d.setDate(d.getDate() + weeksNeeded * 7);
    return { label, weekly, monthly, target_date: d.toISOString().split('T')[0] };
  });
}

interface BudgetCategory {
  name: string;
  monthly_amount: number;
}

export interface Suggestion {
  type: string;
  params?: Record<string, number | string>;
}

export function computeRecategorization(
  gap: number,
  categories: BudgetCategory[]
): Suggestion[] {
  if (gap <= 0 || categories.length === 0) return [];
  const sorted = [...categories].sort((a, b) => b.monthly_amount - a.monthly_amount);
  const suggestions: Suggestion[] = [];
  let covered = 0;
  for (const cat of sorted) {
    if (covered >= gap) break;
    const cut = Math.min(cat.monthly_amount * 0.3, gap - covered);
    suggestions.push({ type: 'REDUCE_CATEGORY', params: { name: cat.name, cut: Math.round(cut) } });
    covered += cut;
  }
  return suggestions;
}

interface GoalForAllocation {
  id: number;
  name: string;
  priority: number;
  weeks_remaining: number;
  remaining: number;
}

export function computeAllocation(
  goals: GoalForAllocation[],
  extraBudget: number
): AllocationSuggestion[] {
  const active = goals
    .filter((g) => Number(g.remaining) > 0)
    .sort((a, b) => a.priority - b.priority || (a.weeks_remaining || 999) - (b.weeks_remaining || 999));

  if (active.length === 0) return [];

  // Goals with fewer weeks remaining are more urgent → higher weight
  const weight = (g: GoalForAllocation) => 1 / Math.max(g.weeks_remaining ?? 52, 1);
  const total_weight = active.reduce((s, g) => s + weight(g), 0);

  return active.map((g) => ({
    goal_id: g.id,
    name: g.name,
    suggested_extra: Math.round((extraBudget * weight(g)) / total_weight * 100) / 100,
  }));
}
