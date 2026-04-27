import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Goal } from '../types';

type Mode = 'date' | 'contribution';

export default function CreateGoal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('date');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [currency, setCurrency] = useState('NIS');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [overflowGoalId, setOverflowGoalId] = useState('');
  const [existingGoals, setExistingGoals] = useState<Goal[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Goal[]>('/goals').then((r) => setExistingGoals(r.data)).catch(() => {});
  }, []);

  function handleBlur() {
    const ta = Number(targetAmount);
    const ia = Number(initialAmount);
    const remaining = ta - ia;
    if (mode === 'date' && targetDate && remaining > 0 && !monthlyContribution) {
      const months = Math.max(1, (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44));
      setMonthlyContribution((remaining / months).toFixed(2));
    } else if (mode === 'contribution' && monthlyContribution && remaining > 0 && !targetDate) {
      const months = Math.ceil(remaining / Number(monthlyContribution));
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      setTargetDate(d.toISOString().split('T')[0]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name, target_amount: Number(targetAmount),
        initial_amount: Number(initialAmount), currency,
      };
      if (targetDate) body.target_date = targetDate;
      if (monthlyContribution) body.monthly_contribution = Number(monthlyContribution);
      if (overflowGoalId) body.overflow_goal_id = Number(overflowGoalId);

      const res = await api.post<Goal>('/goals', body);
      navigate(`/goals/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? t('createGoal.failed'));
    } finally {
      setLoading(false);
    }
  }

  const input = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('createGoal.title')}</h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">{t('createGoal.name')}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={input}
            placeholder={t('createGoal.namePlaceholder')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t('createGoal.targetAmount')}</label>
            <input type="number" min={1} required value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)} onBlur={handleBlur} className={input} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('createGoal.currency')}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className={input.replace('bg-transparent', 'bg-white dark:bg-slate-800')}>
              {['NIS', 'USD', 'EUR', 'GBP'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">{t('createGoal.initialAmount')}</label>
          <input type="number" min={0} value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)} className={input} />
        </div>

        <div>
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden mb-3">
            <button type="button" onClick={() => setMode('date')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'date' ? 'bg-amber-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {t('createGoal.iKnowDate')}
            </button>
            <button type="button" onClick={() => setMode('contribution')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'contribution' ? 'bg-amber-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {t('createGoal.iKnowBudget')}
            </button>
          </div>

          {mode === 'date' ? (
            <div>
              <label className="block text-xs font-medium mb-1">{t('createGoal.targetDate')}</label>
              <input type="date" required value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)} onBlur={handleBlur} className={input} />
              {monthlyContribution && (
                <p className="text-xs text-slate-400 mt-1">
                  {t('createGoal.estMonthly', { amount: monthlyContribution, currency })}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium mb-1">
                {t('createGoal.monthlyContrib', { currency })}
              </label>
              <input type="number" min={1} required value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)} onBlur={handleBlur} className={input} />
              {targetDate && (
                <p className="text-xs text-slate-400 mt-1">
                  {t('createGoal.estDate', { date: targetDate })}
                </p>
              )}
            </div>
          )}
        </div>

        {existingGoals.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1">{t('createGoal.overflowLabel')}</label>
            <select value={overflowGoalId} onChange={(e) => setOverflowGoalId(e.target.value)}
              className={input.replace('bg-transparent', 'bg-white dark:bg-slate-800')}>
              <option value="">— {t('common.none')} —</option>
              {existingGoals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
          {loading ? t('createGoal.creating') : t('createGoal.create')}
        </button>
      </form>
    </div>
  );
}
