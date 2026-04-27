import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { AllocationSuggestion } from '../types';

async function addEntry(goalId: number, amount: number) {
  await api.post(`/goals/${goalId}/entries`, {
    amount,
    entry_date: new Date().toISOString().split('T')[0],
    source_tag: 'manual',
  });
}

export default function MultiGoalAllocator() {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [extra, setExtra] = useState('');
  const [suggestions, setSuggestions] = useState<AllocationSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  async function calculate() {
    if (!extra || Number(extra) <= 0) return;
    setLoading(true);
    setError('');
    setSuggestions(null);
    try {
      const res = await api.get<AllocationSuggestion[]>(`/goals/allocate?extra=${extra}`);
      setSuggestions(res.data);
    } catch {
      setError(t('allocator.error'));
    } finally {
      setLoading(false);
    }
  }

  const total = suggestions?.reduce((s, g) => s + g.suggested_extra, 0) ?? 0;

  async function handleSave(s: AllocationSuggestion) {
    setSaving((prev) => ({ ...prev, [s.goal_id]: true }));
    try {
      await addEntry(s.goal_id, s.suggested_extra);
      setSaved((prev) => ({ ...prev, [s.goal_id]: true }));
    } finally {
      setSaving((prev) => ({ ...prev, [s.goal_id]: false }));
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-1">{t('allocator.title')}</h3>
      <p className="text-xs text-slate-400 mb-4">
        {t('allocator.subtitle')}
      </p>
      <div className="flex gap-2 mb-4">
        <input
          type="number" min={1} placeholder={t('allocator.placeholder', { currency: currencyLabel('NIS') })}
          value={extra} onChange={(e) => setExtra(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
        />
        <button onClick={calculate} disabled={loading || !extra}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
          {loading ? t('allocator.calculating') : t('allocator.calculate')}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {suggestions !== null && suggestions.length === 0 && (
        <p className="text-slate-400 text-sm">{t('allocator.noGoals')}</p>
      )}
      {suggestions !== null && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-2">
            {t('allocator.suggestedSplit')} <strong className="text-amber-500">{Number(extra).toFixed(2)} {currencyLabel('NIS')}</strong>:
          </p>
          {suggestions.map((s) => {
            const pct = total > 0 ? Math.round((s.suggested_extra / total) * 100) : 0;
            const isSaving = saving[s.goal_id];
            const isSaved = saved[s.goal_id];
            return (
              <div key={s.goal_id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-bold text-amber-500">{s.suggested_extra.toFixed(2)} {currencyLabel('NIS')}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                <button
                  onClick={() => handleSave(s)}
                  disabled={isSaving || isSaved}
                  title={isSaved ? t('allocator.added') : t('allocator.addToGoal', { amount: s.suggested_extra.toFixed(2), currency: currencyLabel('NIS'), name: s.name })}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors disabled:cursor-default
                    ${isSaved
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                      : 'bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-600 dark:text-amber-300'}`}
                >
                  {isSaving ? '…' : isSaved ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
