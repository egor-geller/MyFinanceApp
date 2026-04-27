import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function StreakBadge({ weeks }: { weeks: number }) {
  const { t } = useTranslation();
  const hot = weeks >= 4;
  return (
    <motion.div
      animate={{ boxShadow: hot ? '0 0 16px 4px #f59e0b' : 'none' }}
      transition={{ duration: 0.5 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm
        ${hot ? 'bg-amber-400 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
    >
      🔥 {t('streak.badge', { weeks })}
    </motion.div>
  );
}
