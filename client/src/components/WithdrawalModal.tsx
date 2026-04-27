import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { Withdrawal } from '../types';

interface Props { goalId: number; currency: string; onClose: () => void; onWithdrawn: () => void }

export default function WithdrawalModal({ goalId, currency, onClose, onWithdrawn }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await api.post<Withdrawal>(`/goals/${goalId}/withdrawals`, {
        amount: Number(amount),
        withdrawal_date: new Date().toISOString().split('T')[0],
        reason,
      });
      setPreview(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg">{t('withdrawal.title')}</h2>
        {!preview ? (
          <>
            <div>
              <label className="block text-xs font-medium mb-1">{t('withdrawal.amount', { currency: currencyLabel(currency) })}</label>
              <input type="number" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('withdrawal.reason')}</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                {t('withdrawal.cancel')}
              </button>
              <button onClick={handleSubmit} disabled={!amount || loading}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50">
                {t('withdrawal.preview')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm space-y-1">
              <p>{t('withdrawal.previewAmount')} <strong>{preview.amount} {currencyLabel(currency)}</strong></p>
              <p className="text-red-600">
                {t('withdrawal.impact', { weeks: preview.weeks_added })}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                {t('withdrawal.cancel')}
              </button>
              <button onClick={() => { onWithdrawn(); onClose(); }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">
                {t('withdrawal.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
