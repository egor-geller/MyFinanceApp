import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { Goal, Analysis, SavingsEntry } from '../types';
import { STATUS_COLOR } from '../types';
import ProgressChart from '../components/ProgressChart';
import StreakBadge from '../components/StreakBadge';
import CatchUpBanner from '../components/CatchUpBanner';
import WhatIfSimulator from '../components/WhatIfSimulator';
import CostOfDelay from '../components/CostOfDelay';
import SavingPaths from '../components/SavingPaths';
import SuggestionsPanel from '../components/SuggestionsPanel';
import WeeklyEntryForm from '../components/WeeklyEntryForm';
import WithdrawalModal from '../components/WithdrawalModal';
import GoalHistory from '../components/GoalHistory';
import HeatmapChart from '../components/HeatmapChart';
import CurrencyDisplay from '../components/CurrencyDisplay';
import PrivacyAmount from '../components/PrivacyAmount';
import { motion } from 'framer-motion';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      const [goalRes, analysisRes, entriesRes] = await Promise.all([
        api.get<Goal>(`/goals/${id}`),
        api.get<Analysis>(`/goals/${id}/analysis`),
        api.get<SavingsEntry[]>(`/goals/${id}/entries`),
      ]);
      const g = goalRes.data;
      setGoal({ ...g, target_amount: Number(g.target_amount), initial_amount: Number(g.initial_amount) });
      const a = analysisRes.data;
      setAnalysis({
        ...a,
        total_saved: Number(a.total_saved),
        remaining: Number(a.remaining),
        required_weekly: Number(a.required_weekly),
        required_monthly: Number(a.required_monthly),
        avg_weekly_actual: Number(a.avg_weekly_actual),
        catchup_weekly: Number(a.catchup_weekly),
      });
      setEntries(entriesRes.data.map((e) => ({ ...e, amount: Number(e.amount) })));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function deleteEntry(entryId: number) {
    await api.delete(`/goals/${id}/entries/${entryId}`);
    fetchAll();
  }

  async function exportExcel() {
    const lang = localStorage.getItem('lang') ?? 'en';
    const res = await api.get(`/goals/${id}/export?lang=${lang}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal_${id}_export.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function archiveGoal() {
    await api.delete(`/goals/${id}`);
    navigate('/');
  }

  if (loading) return <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>;
  if (!goal || !analysis) return <div className="p-8 text-center text-red-400">Goal not found.</div>;

  const pct = Math.min(100, Math.round((analysis.total_saved / goal.target_amount) * 100));
  const metricCards = [
    { label: t('goalDetail.requiredWeek'), value: `${analysis.required_weekly.toFixed(2)} ${currencyLabel(goal.currency)}` },
    { label: t('goalDetail.requiredMonth'), value: `${analysis.required_monthly.toFixed(2)} ${currencyLabel(goal.currency)}` },
    { label: t('goalDetail.avgWeek'), value: `${analysis.avg_weekly_actual.toFixed(2)} ${currencyLabel(goal.currency)}` },
    { label: t('goalDetail.remaining'), value: `${analysis.remaining.toFixed(2)} ${currencyLabel(goal.currency)}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 sm:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
          <div className="space-y-5">
            <div>
              <Link to="/" className="text-sm text-slate-400 transition-colors hover:text-amber-500">{t('goalDetail.backToDashboard')}</Link>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{goal.name}</h1>
              <div className="mt-3">
                <CurrencyDisplay amount={analysis.total_saved} base={goal.currency} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm ${STATUS_COLOR[analysis.status]}`}>
                {t(`status.${analysis.status}`)}
              </span>
              <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-950/50">
                <StreakBadge weeks={analysis.streak_weeks} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <PrivacyAmount>{analysis.total_saved.toFixed(2)} {currencyLabel(goal.currency)}</PrivacyAmount>
                <PrivacyAmount>{goal.target_amount.toFixed(2)} {currencyLabel(goal.currency)}</PrivacyAmount>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <motion.div
                  className="h-4 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t('goalDetail.weeksRemaining', { pct, weeks: analysis.weeks_remaining })}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {metricCards.map((m, index) => (
              <div
                key={m.label}
                className={`rounded-[1.5rem] px-5 py-4 shadow-sm ${
                  index === 0
                    ? 'bg-slate-900 text-white dark:bg-slate-950'
                    : index === 1
                      ? 'border border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/40'
                      : index === 2
                        ? 'border border-sky-200 bg-sky-50/80 dark:border-sky-900/70 dark:bg-sky-950/30'
                        : 'border border-slate-200 bg-white/85 dark:border-slate-700 dark:bg-slate-950/50'
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.2em] ${
                  index === 0 ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {m.label}
                </p>
                <PrivacyAmount className={`mt-3 block text-2xl font-bold ${
                  index === 0 ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  {m.value}
                </PrivacyAmount>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex gap-3 flex-wrap rounded-[1.75rem] border border-white/70 bg-white/70 p-3 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
        <button onClick={() => setShowWithdrawal(true)}
          className="cursor-pointer rounded-full border border-red-300 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none"/><path d="M6 12h.01M18 12h.01"/>
          </svg>
          {t('goalDetail.withdrawFunds')}
        </button>
        <button onClick={() => setShowHistory(true)}
          className="cursor-pointer rounded-full border border-slate-300 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
          </svg>
          {t('history.button')}
        </button>
        <button onClick={exportExcel}
          className="cursor-pointer rounded-full border border-slate-300 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
          </svg>
          {t('goalDetail.exportExcel')}
        </button>
        <button onClick={() => setShowArchiveConfirm(true)}
          className="cursor-pointer ms-auto rounded-full border border-slate-300 px-4 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          {t('goalDetail.archiveGoal')}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <WeeklyEntryForm goalId={goal.id} currency={goal.currency} onAdded={fetchAll} />
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <SuggestionsPanel suggestions={analysis.suggestions} />
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <SavingPaths paths={analysis.saving_paths} currency={goal.currency} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
              <WhatIfSimulator goalId={goal.id} currency={goal.currency} />
            </div>
            <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
              <CostOfDelay goalId={goal.id} currency={goal.currency} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <CatchUpBanner missedWeeks={analysis.missed_weeks} catchupWeekly={analysis.catchup_weekly} currency={goal.currency} />
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <ProgressChart data={analysis.chart_data} currency={goal.currency} />
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
            <HeatmapChart data={analysis.heatmap_data} />
          </div>
        </div>
      </div>

      {showHistory && (
        <GoalHistory
          goalId={goal.id}
          currency={goal.currency}
          entries={entries}
          onDelete={deleteEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showWithdrawal && (
        <WithdrawalModal goalId={goal.id} currency={goal.currency}
          onClose={() => setShowWithdrawal(false)} onWithdrawn={fetchAll} />
      )}

      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowArchiveConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">{t('goalDetail.archiveConfirm')}</h2>
            <p className="text-sm text-slate-400">{t('goalDetail.archiveConfirmDesc')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={archiveGoal}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-semibold transition-colors">
                {t('goalDetail.archiveConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
