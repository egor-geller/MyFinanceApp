import { motion } from 'framer-motion';
import { Milestone } from '../types';

export default function MilestoneBadges({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="flex gap-3">
      {milestones.map((m) => (
        <motion.div
          key={m.pct}
          initial={{ scale: 0.8, opacity: 0.4 }}
          animate={{ scale: m.reached ? 1.05 : 0.95, opacity: m.reached ? 1 : 0.35 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full text-xs font-bold border-2 transition-colors
            ${m.reached
              ? 'bg-amber-400 border-amber-500 text-white shadow-lg'
              : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400'}`}
        >
          <span className="text-lg">{m.pct === 100 ? '🏆' : m.pct === 75 ? '🥇' : m.pct === 50 ? '🥈' : '🥉'}</span>
          <span>{m.pct}%</span>
        </motion.div>
      ))}
    </div>
  );
}
