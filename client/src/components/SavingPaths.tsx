import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';
import { SavingPath } from '../types';

export default function SavingPaths({ paths, currency }: { paths: SavingPath[]; currency: string }) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const colors: Record<string, string> = {
    Conservative: 'border-green-400 bg-green-50 dark:bg-green-900/20',
    Moderate: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    Aggressive: 'border-red-400 bg-red-50 dark:bg-red-900/20',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-3">{t('paths.title')}</h3>
      <div className="grid grid-cols-3 gap-3">
        {paths.map((p) => (
          <div key={p.label} className={`border-2 rounded-xl p-3 text-center ${colors[p.label]}`}>
            <p className="font-bold text-sm mb-1">{t(`path.${p.label}`)}</p>
            <p className="text-lg font-bold text-amber-600">{p.weekly.toFixed(0)}</p>
            <p className="text-xs text-slate-500">{t('paths.perWeek', { currency: currencyLabel(currency) })}</p>
            <p className="text-xs text-slate-400 mt-1">{p.target_date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
