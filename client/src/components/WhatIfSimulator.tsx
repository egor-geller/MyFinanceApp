import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { WhatIfResult } from '../types';

export default function WhatIfSimulator({ goalId, currency }: { goalId: number; currency: string }) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [extra, setExtra] = useState(50);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await api.get<WhatIfResult>(`/goals/${goalId}/whatif?extra=${extra}`);
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-3">{t('whatif.title')}</h3>
      <p className="text-sm text-slate-500 mb-3">{t('whatif.subtitle')}</p>
      <div className="flex items-center gap-3 mb-4">
        <input type="range" min={10} max={500} step={10} value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="flex-1 accent-amber-500" />
        <span className="w-24 text-right font-semibold text-amber-500">{t('whatif.perWeek', { extra, currency: currencyLabel(currency) })}</span>
      </div>
      <button onClick={run} disabled={loading}
        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm">
        {t('whatif.calculate')}
      </button>
      {result && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm space-y-1">
          <p>{t('whatif.newDate')} <strong>{result.new_target_date}</strong></p>
          <p>{t('whatif.daysSaved')} <strong className="text-amber-500">{t('whatif.earlier', { days: result.days_saved })}</strong></p>
          <p>{t('whatif.newWeekly')} <strong>{result.new_required_weekly.toFixed(2)} {currencyLabel(currency)}</strong></p>
        </div>
      )}
    </div>
  );
}
