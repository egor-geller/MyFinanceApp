import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SavingsEntry } from '../types';
import { useCurrencyLabel } from '../i18n';

interface Props {
  entries: SavingsEntry[];
  currency: string;
  onDelete: (id: number) => void;
}

export default function EntryHistory({ entries, currency, onDelete }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-bold">{t('goalDetail.entryHistory')}</span>
        <span className="text-slate-400 text-sm transition-transform duration-200" style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {open && (
        <div className="mt-3">
          {entries.length === 0 ? (
            <p className="text-sm text-slate-400">{t('goalDetail.noEntries')}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div>
                    <span className="font-medium">{e.amount} {currencyLabel(currency)}</span>
                    {e.is_quick_save && (
                      <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded">⚡</span>
                    )}
                    <span className="ml-2 text-slate-400">
                      {new Date(e.entry_date).toLocaleDateString()}
                    </span>
                    {e.note && <span className="ml-2 text-slate-400">· {e.note}</span>}
                  </div>
                  <button onClick={() => onDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs transition-colors">
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
