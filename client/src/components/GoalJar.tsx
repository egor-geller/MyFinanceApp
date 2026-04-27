import { motion } from 'framer-motion';

const JAR_BODY = 'M 30 26 L 30 34 C 17 36 15 46 15 46 L 15 106 C 15 118 50 121 50 121 C 50 121 85 118 85 106 L 85 46 C 85 46 83 36 70 34 L 70 26 Z';

const LIQUID_TOP_MIN = 47;   // y at 100% full
const LIQUID_BOTTOM = 119;   // y at 0% (empty)
const LIQUID_RANGE = LIQUID_BOTTOM - LIQUID_TOP_MIN;

function jarColor(pct: number) {
  if (pct >= 80) return { fill: '#6ee7b7', stroke: '#059669' };
  if (pct >= 50) return { fill: '#fde68a', stroke: '#d97706' };
  if (pct >= 25) return { fill: '#fed7aa', stroke: '#ea580c' };
  return { fill: '#fecaca', stroke: '#dc2626' };
}

interface Props {
  pct: number;
  goalId: number;
}

export default function GoalJar({ pct, goalId }: Props) {
  const { fill, stroke } = jarColor(pct);
  const liquidY = LIQUID_BOTTOM - (pct / 100) * LIQUID_RANGE;
  const amp = 3;
  const clipId = `jar-${goalId}`;

  const wave1 = `M 0 ${liquidY} Q 25 ${liquidY - amp} 50 ${liquidY} Q 75 ${liquidY + amp} 100 ${liquidY} L 100 ${LIQUID_BOTTOM + 5} L 0 ${LIQUID_BOTTOM + 5} Z`;
  const wave2 = `M 0 ${liquidY} Q 25 ${liquidY + amp} 50 ${liquidY} Q 75 ${liquidY - amp} 100 ${liquidY} L 100 ${LIQUID_BOTTOM + 5} L 0 ${LIQUID_BOTTOM + 5} Z`;

  return (
    <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-sm" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d={JAR_BODY} />
        </clipPath>
      </defs>

      {/* Liquid body — rises from bottom on mount */}
      <motion.rect
        x="0" width="100"
        initial={{ y: LIQUID_BOTTOM + 5 }}
        animate={{ y: liquidY + amp }}
        transition={{ duration: 1.4, ease: [0.34, 1.1, 0.64, 1] }}
        height={LIQUID_RANGE + 20}
        fill={fill}
        clipPath={`url(#${clipId})`}
      />

      {/* Wave on liquid surface */}
      {pct > 0 && pct < 100 && (
        <motion.path
          clipPath={`url(#${clipId})`}
          fill={fill}
          animate={{ d: [wave1, wave2] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      )}

      {/* Jar body outline */}
      <path d={JAR_BODY} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />

      {/* Lid band */}
      <rect x="25" y="16" width="50" height="12" rx="3" fill={stroke} opacity="0.8" />
      {/* Lid top */}
      <rect x="29" y="10" width="42" height="8" rx="2.5" fill={stroke} />

      {/* Percentage label */}
      <text
        x="50" y="86"
        textAnchor="middle"
        fontSize="15"
        fontWeight="bold"
        fill={pct > 35 ? 'white' : stroke}
        style={{ userSelect: 'none', fontFamily: 'inherit' }}
      >
        {pct}%
      </text>
    </svg>
  );
}
