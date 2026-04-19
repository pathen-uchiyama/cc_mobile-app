import { motion } from 'framer-motion';

interface PivotShimmerProps {
  /** The Audible label that triggered the pivot, e.g. "Too much walking". */
  audibleLabel: string;
}

/**
 * Pivot Shimmer — the "Recalculating..." state.
 *
 * Shown after an Audible is selected, before the new Top 3 lands.
 * Uses a parchment-tone shimmer (gold-into-parchment) so the wait
 * still feels boutique, not like a generic spinner.
 */
const PivotShimmer = ({ audibleLabel }: PivotShimmerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
      role="status"
      aria-live="polite"
      aria-label={`Recalculating after ${audibleLabel}`}
    >
      <div className="px-1 mb-3 flex items-center justify-between">
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign font-bold"
          style={{ color: 'hsl(var(--gold))' }}
        >
          Recalculating · {audibleLabel}
        </span>
        <span
          className="font-sans italic text-[10px]"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          easing your day…
        </span>
      </div>

      {/* Three skeleton cards mirroring the Depth Stack */}
      <div className="space-y-3">
        <ShimmerCard heightClass="h-[200px]" widthClass="w-full" />
        <ShimmerCard heightClass="h-[88px]" widthClass="w-[94%]" />
        <ShimmerCard heightClass="h-[88px]" widthClass="w-[88%]" />
      </div>
    </motion.div>
  );
};

const ShimmerCard = ({
  heightClass,
  widthClass,
}: {
  heightClass: string;
  widthClass: string;
}) => (
  <div
    className={`${heightClass} ${widthClass} mx-auto relative overflow-hidden`}
    style={{
      borderRadius: '16px',
      backgroundColor: 'hsl(var(--card))',
      boxShadow:
        '0 0 0 1px hsl(var(--obsidian) / 0.04), 0 12px 30px hsl(var(--obsidian) / 0.06)',
    }}
  >
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(110deg, transparent 0%, hsl(var(--gold) / 0.18) 35%, hsl(var(--parchment)) 50%, hsl(var(--gold) / 0.18) 65%, transparent 100%)',
        backgroundSize: '220% 100%',
      }}
      animate={{ backgroundPosition: ['220% 0%', '-120% 0%'] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export default PivotShimmer;
