import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';

interface Props {
  goalId: number;
  goalName: string;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}

const PRESETS = [15, 20, 50];

export default function SaveNowModal({ goalId, goalName, currency, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  async function save(value: number) {
    setLoading(true);
    try {
      await api.post(`/goals/${goalId}/entries`, {
        amount: value,
        entry_date: new Date().toISOString().split('T')[0],
        source_tag: 'quick_save',
        is_quick_save: true,
      });
      setToast(t('saveNow.saved', { amount: value, currency }));
      setTimeout(() => { onSaved(); onClose(); }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.65)] dark:border-slate-700 dark:bg-slate-900/95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 space-y-2">
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {t('saveNow.quickSave')}
            </div>
            <h2 className="text-xl font-bold tracking-tight">{t('saveNow.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{goalName}</p>
          </div>

          {toast && <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">{toast}</p>}

          <div className="mb-5 grid grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => save(p)} disabled={loading}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-700 transition-all hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-md disabled:opacity-50 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/70">
                {p} {currencyLabel(currency)}
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/50">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Custom amount
            </p>
            <div className="flex gap-2">
            <input
              type="number" min={1} placeholder={t('saveNow.customAmount')}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-slate-600 dark:bg-slate-900"
            />
            <button
              onClick={() => amount && save(Number(amount))}
              disabled={!amount || loading}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 font-semibold text-white transition-all hover:bg-amber-500 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {t('saveNow.save')}
            </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
