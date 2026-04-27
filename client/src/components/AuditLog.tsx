import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { AuditEntry } from '../types';

export default function AuditLog({ goalId }: { goalId: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    api.get<AuditEntry[]>(`/goals/${goalId}/audit`).then((r) => setLogs(r.data));
  }, [open, goalId]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center font-bold text-left">
        <span>{t('audit.title')}</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400">{t('audit.noChanges')}</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left pb-1">{t('audit.field')}</th>
                <th className="text-left pb-1">{t('audit.from')}</th>
                <th className="text-left pb-1">{t('audit.to')}</th>
                <th className="text-left pb-1">{t('audit.when')}</th>
              </tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-1 font-medium">{l.field_changed}</td>
                    <td className="py-1 text-red-400">{l.old_value ?? '—'}</td>
                    <td className="py-1 text-green-500">{l.new_value ?? '—'}</td>
                    <td className="py-1 text-slate-400">{new Date(l.changed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
