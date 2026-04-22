import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Star } from 'lucide-react';
import type { MustDo } from '@/hooks/park/usePlanStack';

interface MustDoFanProps {
  open: boolean;
  onClose: () => void;
  mustDos: MustDo[];
  /** Promote a Must-Do attraction onto the active stack as the new "Now" card. */
  onPromote: (mustDoId: string, attraction: string) => void;
}

/**
 * Recommendation order:
 *  1. Incomplete first (sorted by remaining rides desc → biggest gap first).
 *  2. Then completed, dimmed, non-interactive.
 *
 * The top row is highlighted as "Recommended next" so the guest sees a clear
 * pick rather than a roulette of equally-weighted chips.
 */
const rankMustDos = (mustDos: MustDo[]): MustDo[] => {
  const score = (m: MustDo) => {
    const remaining = Math.max(0, m.desired - m.done);
    if (remaining === 0) return -1; // sink completed
    // Bigger remaining → higher priority. Tie-breaker: more desired overall.
    return remaining * 100 + m.desired;
  };
  return [...mustDos].sort((a, b) => score(b) - score(a));
};

/**
 * Must-Do priority sheet — opened from the Must-Do tab.
 *
 * Replaces the radial circle with a ranked, scrollable list. Each row shows
 * a rank pip, the attraction name, and progress (n/m). Tapping a row pulls
 * that attraction in as the new "Now" card on the active journey.
 *
 * Anchored bottom-sheet style above the nav so chips never overlap and the
 * tap targets stay generous.
 */
const MustDoFan = ({ open, onClose, mustDos, onPromote }: MustDoFanProps) => {
  const ranked = rankMustDos(mustDos);
  const recommended = ranked.find((m) => m.done < m.desired);

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
            className="fixed inset-0 z-[9995]"
            style={{
              background: 'hsl(var(--parchment) / 0.78)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)',
            }}
          />

          {/* Anchored card — sits above the bottom nav (nav z=9998). */}
          <motion.aside
            role="dialog"
            aria-label="Must-Do priority list"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-card rounded-2xl flex flex-col z-[9999]"
            style={{
              maxHeight: '70vh',
              boxShadow:
                '0 24px 60px hsl(var(--obsidian) / 0.22), 0 0 0 1px hsl(var(--gold) / 0.2)',
            }}
          >
            <header className="px-5 pt-5 pb-3 shrink-0">
              <p
                className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1"
                style={{ color: 'hsl(var(--gold))' }}
              >
                Must-Do · Recommended Order
              </p>
              <h3 className="font-display text-[18px] text-foreground leading-tight">
                Pull the next ride into your journey.
              </h3>
            </header>

            <ol className="list-none p-3 m-0 space-y-1.5 overflow-y-auto">
              {ranked.map((m, i) => {
                const remaining = Math.max(0, m.desired - m.done);
                const isComplete = remaining === 0;
                const isRecommended = recommended?.id === m.id;

                return (
                  <li key={m.id}>
                    <motion.button
                      whileTap={isComplete ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        if (isComplete) return;
                        onClose();
                        onPromote(m.id, m.attraction);
                      }}
                      disabled={isComplete}
                      aria-label={`${m.attraction} — ${
                        isComplete
                          ? 'all rides complete'
                          : `${remaining} ride${remaining === 1 ? '' : 's'} remaining, pull into active journey`
                      }`}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-accent/5 disabled:cursor-not-allowed"
                      style={{
                        minHeight: '56px',
                        opacity: isComplete ? 0.5 : 1,
                        background: isRecommended
                          ? 'hsl(var(--gold) / 0.10)'
                          : 'transparent',
                        boxShadow: isRecommended
                          ? '0 0 0 1px hsl(var(--gold) / 0.45)'
                          : 'none',
                      }}
                    >
                      {/* Rank pip */}
                      <span
                        className="shrink-0 flex items-center justify-center rounded-full font-display text-[14px] tabular-nums font-bold"
                        style={{
                          width: '28px',
                          height: '28px',
                          background: isComplete
                            ? 'hsl(var(--slate-plaid) / 0.15)'
                            : isRecommended
                              ? 'hsl(var(--gold))'
                              : 'hsl(var(--gold) / 0.15)',
                          color: isComplete
                            ? 'hsl(var(--slate-plaid))'
                            : isRecommended
                              ? 'hsl(var(--card))'
                              : 'hsl(var(--gold))',
                        }}
                      >
                        {isComplete ? <Check size={14} /> : i + 1}
                      </span>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-display text-[14px] leading-tight text-foreground truncate"
                          style={{
                            textDecoration: isComplete ? 'line-through' : 'none',
                          }}
                        >
                          {m.attraction}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isRecommended && (
                            <span
                              className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
                              style={{ color: 'hsl(var(--gold))' }}
                            >
                              Recommended next
                            </span>
                          )}
                          <span
                            className="font-sans text-[10px] tabular-nums"
                            style={{ color: 'hsl(var(--slate-plaid))' }}
                          >
                            {m.done}/{m.desired} ride{m.desired === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      {/* Affordance */}
                      {!isComplete ? (
                        <ChevronRight
                          size={16}
                          className="shrink-0"
                          style={{ color: 'hsl(var(--gold))' }}
                        />
                      ) : (
                        <Star
                          size={14}
                          className="shrink-0"
                          style={{ color: 'hsl(var(--slate-plaid))' }}
                          fill="currentColor"
                        />
                      )}
                    </motion.button>
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 m-3 mt-1 rounded-xl py-2.5 bg-transparent border cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold"
              style={{
                borderColor: 'hsl(var(--obsidian) / 0.1)',
                color: 'hsl(var(--slate-plaid))',
              }}
            >
              Close
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MustDoFan;
