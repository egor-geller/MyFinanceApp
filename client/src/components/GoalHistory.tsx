import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { SavingsEntry, AuditEntry } from '../types';
import { useCurrencyLabel } from '../i18n';

interface Props {
  goalId: number;
  currency: string;
  entries: SavingsEntry[];
  onDelete: (id: number) => void;
  onClose: () => void;
}

export default function GoalHistory({ goalId, currency, entries, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [tab, setTab] = useState<'entries' | 'changes'>('entries');
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    api.get<AuditEntry[]>(`/goals/${goalId}/audit`).then((r) => setLogs(r.data));
  }, [goalId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-lg">{t('history.title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 px-5">
          {(['entries', 'changes'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {t(`history.${key}`)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {tab === 'entries' && (
            entries.length === 0 ? (
              <p className="text-sm text-slate-400">{t('history.noEntries')}</p>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                      <span className="font-medium">{e.amount} {currencyLabel(currency)}</span>
                      {e.is_quick_save && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded">⚡</span>
                      )}
                      <span className="text-slate-400">{new Date(e.entry_date).toLocaleDateString()}</span>
                      {e.note && <span className="text-slate-400">· {e.note}</span>}
                    </div>
                    <button onClick={() => onDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs transition-colors shrink-0 ms-3">
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'changes' && (
            logs.length === 0 ? (
              <p className="text-sm text-slate-400">{t('history.noChanges')}</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-start pb-1">{t('audit.field')}</th>
                    <th className="text-start pb-1">{t('audit.from')}</th>
                    <th className="text-start pb-1">{t('audit.to')}</th>
                    <th className="text-start pb-1">{t('audit.when')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-1.5 font-medium">{l.field_changed}</td>
                      <td className="py-1.5 text-red-400">{l.old_value ?? '—'}</td>
                      <td className="py-1.5 text-green-500">{l.new_value ?? '—'}</td>
                      <td className="py-1.5 text-slate-400">{new Date(l.changed_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
