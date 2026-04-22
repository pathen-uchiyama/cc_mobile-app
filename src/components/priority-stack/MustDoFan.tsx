import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import type { MustDo } from '@/hooks/park/usePlanStack';

interface MustDoFanProps {
  open: boolean;
  onClose: () => void;
  mustDos: MustDo[];
  /** Promote a Must-Do attraction onto the active stack as the new "Now" card. */
  onPromote: (mustDoId: string, attraction: string) => void;
}

/**
 * Radius of the fan in pixels — distance from the Must-Do tab anchor.
 * Slightly larger than the Pivot fan because the Must-Do tab sits at center
 * and we have more horizontal headroom.
 */
const FAN_RADIUS = 130;
/** Sweep above the tab — wide arc since the tab is centered. */
const FAN_START_DEG = 200; // upper-left
const FAN_END_DEG = 340;   // upper-right

/**
 * Must-Do Fan — radial menu opened from the Must-Do tab.
 *
 * Each chip is one Must-Do attraction with a tiny "n/m" progress badge.
 * Tap a chip → it's pulled into the active journey as the new "Now" card.
 * Completed Must-Dos render dim and disabled.
 */
const MustDoFan = ({ open, onClose, mustDos, onPromote }: MustDoFanProps) => {
  const items = mustDos.slice(0, 6); // cap the arc
  const step = items.length > 1
    ? (FAN_END_DEG - FAN_START_DEG) / (items.length - 1)
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Parchment scrim — tap to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9970]"
            style={{
              background: 'hsl(var(--parchment) / 0.78)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)',
            }}
          />

          {/* Fan anchor positioned over the Must-Do tab (2nd of 3, ~50% width) */}
          <div
            className="fixed inset-x-0 bottom-0 z-[9985] pointer-events-none mx-auto max-w-[448px] px-4"
            style={{ height: '0px' }}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                bottom: '88px',
                width: 0,
                height: 0,
              }}
            >
              {/* Eyebrow label floating above the fan */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: 0.05 }}
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  bottom: FAN_RADIUS + 60,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                <p
                  className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
                  style={{ color: 'hsl(var(--gold))' }}
                >
                  Pull into Active Journey
                </p>
              </motion.div>

              {items.map((m, i) => {
                const isComplete = m.done >= m.desired;
                const angleDeg = items.length === 1
                  ? 270 // straight up if just one
                  : FAN_START_DEG + step * i;
                const angleRad = (angleDeg * Math.PI) / 180;
                const x = Math.cos(angleRad) * FAN_RADIUS;
                const y = Math.sin(angleRad) * FAN_RADIUS;

                return (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    transition={{
                      type: 'spring',
                      damping: 18,
                      stiffness: 240,
                      delay: i * 0.04,
                    }}
                    whileTap={isComplete ? undefined : { scale: 0.92 }}
                    onClick={() => {
                      if (isComplete) return;
                      onClose();
                      onPromote(m.id, m.attraction);
                    }}
                    disabled={isComplete}
                    aria-label={`${m.attraction}${isComplete ? ' — complete' : ' — pull into active journey'}`}
                    className="absolute pointer-events-auto flex flex-col items-center justify-center gap-1 rounded-full bg-card border-none cursor-pointer"
                    style={{
                      width: '76px',
                      height: '76px',
                      marginLeft: '-38px',
                      marginTop: '-38px',
                      padding: '4px',
                      boxShadow: isComplete
                        ? '0 6px 16px hsl(var(--obsidian) / 0.08), 0 0 0 1px hsl(var(--slate-plaid) / 0.25)'
                        : '0 12px 28px hsl(var(--obsidian) / 0.18), 0 0 0 1.5px hsl(var(--gold))',
                      color: isComplete
                        ? 'hsl(var(--slate-plaid))'
                        : 'hsl(var(--gold))',
                      opacity: isComplete ? 0.6 : 1,
                    }}
                  >
                    {isComplete ? <Check size={16} /> : <Star size={16} />}
                    <span
                      className="font-sans text-[8.5px] font-bold leading-tight text-center px-0.5"
                      style={{
                        color: isComplete
                          ? 'hsl(var(--slate-plaid))'
                          : 'hsl(var(--obsidian))',
                        // Allow up to 2 lines for longer attraction names
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {m.attraction}
                    </span>

                    {/* Progress pip — tiny n/m badge */}
                    {m.desired > 1 && (
                      <span
                        aria-hidden
                        className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-sans font-bold tabular-nums"
                        style={{
                          minWidth: '18px',
                          height: '14px',
                          padding: '0 4px',
                          fontSize: '8.5px',
                          lineHeight: 1,
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--obsidian))',
                          border: '1px solid hsl(var(--gold))',
                        }}
                      >
                        {m.done}/{m.desired}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MustDoFan;
