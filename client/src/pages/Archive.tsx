import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import api from '../api/client';
import PrivacyAmount from '../components/PrivacyAmount';

interface ArchivedGoal {
  id: number;
  name: string;
  target_amount: number;
  currency: string;
  target_date: string | null;
  deleted_at: string;
}

export default function Archive() {
  const [goals, setGoals] = useState<ArchivedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();

  async function fetchArchived() {
    const res = await api.get<ArchivedGoal[]>('/goals/archived');
    setGoals(res.data);
    setLoading(false);
  }

  useEffect(() => { fetchArchived(); }, []);

  async function restore(id: number) {
    await api.post(`/goals/${id}/restore`);
    fetchArchived();
  }

  if (loading) return <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('archive.title')}</h1>
      {goals.length === 0 ? (
        <p className="text-slate-400">{t('archive.noArchived')}</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{g.name}</p>
                <p className="text-sm text-slate-400">
                  <PrivacyAmount>{g.target_amount} {currencyLabel(g.currency)}</PrivacyAmount>
                  {g.target_date && ` · ${t('archive.due')} ${new Date(g.target_date).toLocaleDateString()}`}
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-500">
                  {t('archive.archived')} {new Date(g.deleted_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => restore(g.id)}
                className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg transition-colors font-semibold">
                {t('common.restore')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
