import CalendarHeatmap from 'react-calendar-heatmap';
import { useTranslation } from 'react-i18next';

interface Props { data: { date: string; count: number }[] }

export default function HeatmapChart({ data }: Props) {
  const { t, i18n } = useTranslation();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(2024, i, 1))
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-3">{t('heatmap.title')}</h3>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        monthLabels={monthLabels}
        values={data.map((d) => ({ date: d.date, count: d.count }))}
        classForValue={(value) => {
          if (!value || value.count === 0) return 'fill-slate-100 dark:fill-slate-700';
          if (value.count >= 4) return 'fill-amber-500';
          if (value.count >= 2) return 'fill-amber-300';
          return 'fill-amber-100';
        }}
        titleForValue={(value) =>
          value
            ? t('heatmap.entries', { date: value.date, count: value.count })
            : t('heatmap.noActivity')
        }
      />
    </div>
  );
}
