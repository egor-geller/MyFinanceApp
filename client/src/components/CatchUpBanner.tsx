import { useTranslation } from 'react-i18next';
import { useCurrencyLabel } from '../i18n';

interface Props { missedWeeks: number; catchupWeekly: number; currency: string }

export default function CatchUpBanner({ missedWeeks, catchupWeekly, currency }: Props) {
  const { t } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  if (missedWeeks === 0) return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-4 text-sm">
      <p className="font-semibold text-green-700 dark:text-green-300">{t('catchup.noMissed')}</p>
    </div>
  );
  return (
    <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-xl p-4 text-sm">
      <p className="font-semibold text-orange-700 dark:text-orange-300">
        {t('catchup.missed', { count: missedWeeks })}
      </p>
      <p className="text-orange-600 dark:text-orange-400 mt-1">
        {t('catchup.newRequired')} <strong>{catchupWeekly.toFixed(2)} {currencyLabel(currency)}</strong>
      </p>
    </div>
  );
}
