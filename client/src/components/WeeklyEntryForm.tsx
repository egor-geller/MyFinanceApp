import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import { EntrySource } from '../types';

interface Props { goalId: number; currency: string; onAdded: () => void }

export default function WeeklyEntryForm({ goalId, currency, onAdded }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [source, setSource] = useState<EntrySource>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/goals/${goalId}/entries`, { amount: Number(amount), entry_date: date, note, source_tag: source });
      setAmount(''); setNote('');
      onAdded();
    } catch {
      setError(t('entry.failed'));
    } finally {
      setLoading(false);
    }
  }

  const sources: EntrySource[] = ['salary_bonus', 'side_hustle', 'expense_cut', 'gift', 'quick_save', 'manual', 'other'];

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 space-y-3">
      <h3 className="font-bold">{t('entry.title')}</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">{t('entry.amount', { currency: currencyLabel(currency) })}</label>
          <input type="number" min={0.01} step={0.01} required value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t('entry.date')}</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">{t('entry.source')}</label>
        <select value={source} onChange={(e) => setSource(e.target.value as EntrySource)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          {sources.map((v) => <option key={v} value={v}>{t(`source.${v}`)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">{t('entry.note')}</label>
        <input value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm">
        {loading ? t('entry.saving') : t('entry.addEntry')}
      </button>
    </form>
  );
}
