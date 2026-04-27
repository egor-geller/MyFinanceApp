import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { GoalView, Analysis, GoalStatus } from '../types';
import GoalCard from '../components/GoalCard';
import MultiGoalAllocator from '../components/MultiGoalAllocator';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function Dashboard() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<GoalView[]>([]);
  const [statuses, setStatuses] = useState<Record<number, GoalStatus>>({});
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get<GoalView[]>('/goals');
      setGoals(res.data.map((g) => ({
        ...g,
        total_saved: Number(g.total_saved),
        remaining: Number(g.remaining),
        target_amount: Number(g.target_amount),
        initial_amount: Number(g.initial_amount),
      })));
      const analyses = await Promise.allSettled(
        res.data.map((g) => api.get<Analysis>(`/goals/${g.id}/analysis`))
      );
      const map: Record<number, GoalStatus> = {};
      analyses.forEach((r, i) => {
        if (r.status === 'fulfilled') map[res.data[i].id] = r.value.data.status;
      });
      setStatuses(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  useSocket(token, fetchGoals);

  if (loading) return <div className="p-8 text-center text-slate-400">{t('dashboard.loadingGoals')}</div>;

  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.total_saved), 0);
  const completion = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 sm:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {t('dashboard.overview')}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t('dashboard.title')}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/goals/new"
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30"
              >
                {t('dashboard.newGoal')}
              </Link>
              <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                {t('dashboard.activeGoals', { count: goals.length })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-slate-900 px-5 py-4 text-white shadow-xl shadow-slate-900/20 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('dashboard.savedSoFar')}</p>
              <p className="mt-3 text-3xl font-bold">{totalSaved.toFixed(0)}</p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 px-5 py-4 dark:border-amber-900/70 dark:bg-amber-950/40">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">{t('dashboard.targeted')}</p>
              <p className="mt-3 text-3xl font-bold text-amber-900 dark:text-amber-100">{totalTarget.toFixed(0)}</p>
            </div>
            <div className="rounded-3xl border border-sky-200 bg-sky-50/80 px-5 py-4 dark:border-sky-900/70 dark:bg-sky-950/30">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">{t('dashboard.portfolioProgress')}</p>
              <p className="mt-3 text-3xl font-bold text-sky-900 dark:text-sky-100">{completion}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{t('dashboard.yourGoals')}</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.yourGoalsHint')}</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/70 shadow-inner dark:bg-slate-800/80">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-sky-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      {goals.length > 1 && <MultiGoalAllocator />}

      {goals.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-slate-400 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
          <p className="mb-2 text-lg font-semibold text-slate-600 dark:text-slate-200">{t('dashboard.noGoals')}</p>
          <p className="mb-5 text-sm">{t('dashboard.emptyHint')}</p>
          <Link to="/goals/new" className="inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600">
            {t('dashboard.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} status={statuses[g.id]} onRefresh={fetchGoals} />
          ))}
        </div>
      )}
    </div>
  );
}
