export interface WhatIfResult {
  new_target_date: string;
  days_saved: number;
  new_required_weekly: number;
}

export interface CostOfDelayResult {
  delay_months: number;
  extra_per_month: number;
  new_required_monthly: number;
  new_target_date: string;
}

export function computeWhatIf(
  remaining: number,
  required_weekly: number,
  weeks_remaining: number,
  extraPerWeek: number
): WhatIfResult {
  const newWeekly = required_weekly + extraPerWeek;
  const newWeeks = newWeekly > 0 ? Math.ceil(remaining / newWeekly) : weeks_remaining;
  const daysSaved = (weeks_remaining - newWeeks) * 7;
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + newWeeks * 7);
  return {
    new_target_date: newDate.toISOString().split('T')[0],
    days_saved: Math.max(0, daysSaved),
    new_required_weekly: Math.round(newWeekly * 100) / 100,
  };
}

export function computeCostOfDelay(
  targetAmount: number,
  originalMonthly: number,
  months_remaining: number,
  delayMonths: number
): CostOfDelayResult {
  const newMonths = months_remaining - delayMonths;
  const newMonthly = newMonths > 0 ? targetAmount / newMonths : targetAmount;
  const extra = newMonthly - originalMonthly;
  const newDate = new Date();
  newDate.setMonth(newDate.getMonth() + months_remaining);
  return {
    delay_months: delayMonths,
    extra_per_month: Math.round(extra * 100) / 100,
    new_required_monthly: Math.round(newMonthly * 100) / 100,
    new_target_date: newDate.toISOString().split('T')[0],
  };
}
