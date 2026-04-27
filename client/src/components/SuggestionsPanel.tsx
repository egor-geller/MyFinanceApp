import { useTranslation } from 'react-i18next';
import { Suggestion } from '../types';

export default function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  const { t } = useTranslation();
  if (!suggestions.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-3">{t('suggestions.title')}</h3>
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-amber-500 mt-0.5">→</span>
            <span>{t(`suggestions.${s.type}`, { ...s.params, defaultValue: s.type })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
