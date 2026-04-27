export interface User {
  id: number;
  email: string;
  name: string;
  email_reminders: boolean;
  email_monthly_report: boolean;
}

export interface UserProfile {
  monthly_income: number | null;
  preferred_currency: string;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: number;
  name: string;
  monthly_amount: number;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  initial_amount: number;
  target_date: string | null;
  monthly_contribution: number | null;
  start_date: string;
  currency: string;
  priority: 1 | 2 | 3 | 4 | 5;
  overflow_goal_id: number | null;
  deleted_at: string | null;
}

export interface GoalView extends Goal {
  total_saved: number;
  remaining: number;
  weeks_remaining: number;
  total_months: number;
}

export type EntrySource =
  | 'salary_bonus'
  | 'side_hustle'
  | 'expense_cut'
  | 'gift'
  | 'quick_save'
  | 'manual'
  | 'other';

export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  salary_bonus: 'Salary Bonus',
  side_hustle: 'Side Hustle',
  expense_cut: 'Expense Cut',
  gift: 'Gift',
  quick_save: 'Quick Save',
  manual: 'Manual',
  other: 'Other',
};

export interface SavingsEntry {
  id: number;
  goal_id: number;
  amount: number;
  entry_date: string;
  note?: string;
  source_tag: EntrySource;
  is_quick_save: boolean;
}

export interface Withdrawal {
  id: number;
  goal_id: number;
  amount: number;
  reason?: string;
  withdrawal_date: string;
  weeks_added: number;
}

export interface AuditEntry {
  id: number;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_at: string;
}

export type GoalStatus =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OFF_TRACK'
  | 'COMPLETE'
  | 'OVERDUE'
  | 'HIGH_PRESSURE';

export const STATUS_LABEL: Record<GoalStatus, string> = {
  ON_TRACK: 'On Track',
  AT_RISK: 'At Risk',
  OFF_TRACK: 'Off Track',
  COMPLETE: 'Complete',
  OVERDUE: 'Overdue',
  HIGH_PRESSURE: 'High Pressure',
};

export const STATUS_COLOR: Record<GoalStatus, string> = {
  ON_TRACK: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  AT_RISK: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  OFF_TRACK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  COMPLETE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  OVERDUE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  HIGH_PRESSURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export interface SavingPath {
  label: 'Conservative' | 'Moderate' | 'Aggressive';
  weekly: number;
  monthly: number;
  target_date: string;
}

export interface Milestone {
  pct: 25 | 50 | 75 | 100;
  reached: boolean;
  date_reached: string | null;
}

export interface Suggestion {
  type: string;
  params?: Record<string, number | string>;
}

export interface Analysis {
  total_saved: number;
  remaining: number;
  weeks_remaining: number;
  required_weekly: number;
  required_monthly: number;
  avg_weekly_actual: number;
  status: GoalStatus;
  missed_weeks: number;
  catchup_weekly: number;
  streak_weeks: number;
  milestones: Milestone[];
  saving_paths: SavingPath[];
  suggestions: Suggestion[];
  chart_data: { date: string; actual: number; required: number }[];
  heatmap_data: { date: string; count: number }[];
}

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

export interface AllocationSuggestion {
  goal_id: number;
  name: string;
  suggested_extra: number;
}

export interface ProjectionPoint {
  n: number;
  projected_date: string;
  projected_total: number;
}
