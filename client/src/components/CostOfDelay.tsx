import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { CostOfDelayResult } from '../types';

export default function CostOfDelay({ goalId, currency }: { goalId: number; currency: string }) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<CostOfDelayResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(months: number) {
    if (selected === months) {
      setSelected(null);
      setResult(null);
      return;
    }
    setLoading(true);
    setSelected(months);
    try {
      const res = await api.get<CostOfDelayResult>(`/goals/${goalId}/delay?months=${months}`);
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-3">{t('delay.title')}</h3>
      <p className="text-sm text-slate-500 mb-3">{t('delay.subtitle')}</p>
      <div className="flex gap-2 mb-4">
        {[1, 3, 6].map((m) => (
          <button key={m} onClick={() => run(m)} disabled={loading}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              selected === m
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900'
            }`}>
            {m} {m === 1 ? t('delay.month') : t('delay.months')}
          </button>
        ))}
      </div>
      {result && selected !== null && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
          <p>
            {t('delay.delay', { months: selected })}{' '}
            <strong className="text-red-500">+{result.extra_per_month.toFixed(2)} {currencyLabel(currency)}{t('delay.perMonth')}</strong>
          </p>
          <p className="text-slate-500">
            {t('delay.newRequired')} {result.new_required_monthly.toFixed(2)} {currencyLabel(currency)}{t('delay.perMonth')}
          </p>
        </div>
      )}
    </div>
  );
}
