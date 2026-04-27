import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

interface DataPoint { date: string; actual: number; required: number }

export default function ProgressChart({ data, currency }: { data: DataPoint[]; currency: string }) {
  const { t } = useTranslation();
  const sliced = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 20)) === 0);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
      <h3 className="font-bold mb-4">{t('chart.title')}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sliced}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} ${currency}`} />
          <Tooltip formatter={(v: number) => `${v.toFixed(2)} ${currency}`} />
          <Legend />
          <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} dot={false} name={t('chart.actual')} />
          <Line type="monotone" dataKey="required" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" name={t('chart.required')} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
