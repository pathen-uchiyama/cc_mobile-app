import { motion, useReducedMotion } from 'framer-motion';

/**
 * Parchment shimmer placeholder for the Hero + Horizon stack.
 *
 * Renders the same silhouette as `HeroHorizonStack` (one tall card +
 * two stubs) so the layout doesn't jump when real data arrives. Used
 * during the brief moment between auth/sync and first plan render.
 */
const HeroSkeleton = () => {
  const reduce = useReducedMotion();
  const shimmer = reduce
    ? {}
    : {
        animate: { opacity: [0.55, 1, 0.55] },
        transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' as const },
      };

  return (
    <div className="flex flex-col" aria-busy="true" aria-live="polite" aria-label="Loading your day">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="font-sans text-[9px] uppercase tracking-sovereign font-bold text-gold">
          The Sovereign Stack
        </span>
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-slate-plaid">
          Composing…
        </span>
      </div>

      {/* Hero placeholder */}
      <motion.div
        {...shimmer}
        className="rounded-2xl bg-card mb-3.5 overflow-hidden"
        style={{ boxShadow: '0 0 0 1px hsl(var(--gold) / 0.08), 0 24px 48px -8px hsl(var(--obsidian) / 0.10)' }}
      >
        <div className="p-6 space-y-3">
          <div className="h-2.5 w-20 rounded-full bg-muted" />
          <div className="h-7 w-3/4 rounded-md bg-muted" />
          <div className="h-3 w-full rounded bg-muted/70" />
          <div className="h-3 w-5/6 rounded bg-muted/70" />
          <div className="h-12 w-full rounded-2xl bg-muted mt-4" />
        </div>
        <div className="border-t border-border/40 p-4 flex justify-between">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </motion.div>

      {/* Horizon stubs */}
      {[94, 86].map((w, i) => (
        <motion.div
          key={i}
          {...shimmer}
          className="rounded-2xl bg-card mx-auto"
          style={{
            width: `${w}%`,
            marginTop: i === 0 ? 0 : '-28px',
            zIndex: 2 - i,
            position: 'relative',
            boxShadow: '0 0 0 1px hsl(var(--obsidian) / 0.05), 0 8px 22px hsl(var(--obsidian) / 0.06)',
          }}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-2.5 w-16 rounded-full bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
            <div className="h-7 w-12 rounded-full bg-muted ml-3" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HeroSkeleton;
