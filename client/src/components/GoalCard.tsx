import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GoalView, GoalStatus, STATUS_COLOR } from '../types';
import { useCurrencyLabel } from '../i18n';
import SaveNowModal from './SaveNowModal';
import PrivacyAmount from './PrivacyAmount';
import GoalJar from './GoalJar';

interface Props {
  goal: GoalView;
  status?: GoalStatus;
  onRefresh: () => void;
}

export default function GoalCard({ goal, status, onRefresh }: Props) {
  const [showSaveNow, setShowSaveNow] = useState(false);
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();

  const totalSaved = Number(goal.total_saved);
  const targetAmount = Number(goal.target_amount);

  const pct = targetAmount > 0
    ? Math.min(100, Math.round((totalSaved / targetAmount) * 100))
    : 0;

  const daysLeft = goal.target_date
    ? Math.max(0, Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <>
      <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] dark:border-slate-700/80 dark:bg-slate-900/75">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-amber-100/80 via-orange-50/30 to-sky-100/70 dark:from-amber-950/40 dark:via-transparent dark:to-sky-950/40" />
        <div className="relative flex items-center gap-4">
          {/* Jar */}
          <div className="h-28 w-20 shrink-0">
            <GoalJar pct={pct} goalId={goal.id} />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/goals/${goal.id}`}
                className="truncate text-base leading-tight font-bold text-slate-900 transition-colors group-hover:text-amber-600 dark:text-white"
              >
                {goal.name}
              </Link>
              {status && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 shadow-sm ${STATUS_COLOR[status]}`}>
                  {t(`status.${status}`)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <PrivacyAmount className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                {totalSaved.toFixed(2)} / {targetAmount.toFixed(2)} {currencyLabel(goal.currency)}
              </PrivacyAmount>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-sky-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>{t('goalCard.funded', { pct })}</span>
                <span>
                  {daysLeft !== null ? t('goalCard.daysLeft', { count: daysLeft }) : t('goalCard.noDeadline')}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-1 text-sm">
              <Link
                to={`/goals/${goal.id}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t('goalCard.viewDetails')}
              </Link>
              <button
                onClick={() => setShowSaveNow(true)}
                className="rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/30 dark:bg-white dark:text-slate-900 dark:hover:bg-amber-300"
              >
                {t('goalCard.saveNow')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSaveNow && (
        <SaveNowModal
          goalId={goal.id}
          goalName={goal.name}
          currency={goal.currency}
          onClose={() => setShowSaveNow(false)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}
