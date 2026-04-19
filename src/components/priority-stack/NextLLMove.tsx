import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, ChevronRight } from 'lucide-react';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';
import type { ServiceTier } from '@/contexts/CompanionContext';

/**
 * The Next LL Move — a single, ranked recommendation.
 *
 * Replaces the spreadsheet-style LL strip. Surfaces ONE decision:
 * "This is the next Lightning Lane worth your attention, here's why."
 *
 * Tap to secure → it's gone, the next-best move slides in.
 * Tap "Show all" to see the full backlog (collapsed by default).
 */

interface LLOpportunity {
  id: string;
  ride: string;
  land: string;
  window: string;
  /** Minutes saved vs. standby — drives the rank. */
  savedMin: number;
  /** Why this is the recommended next move. */
  reason: string;
  /** ILL = paid Individual LL, LL = standard Multi-Pass. */
  type: 'll' | 'ill';
}

const POOL: LLOpportunity[] = [
  {
    id: 'op1',
    ride: 'Space Mountain',
    land: 'Tomorrowland',
    window: '12:30 – 1:30',
    savedMin: 55,
    reason: 'Standby just spiked to 70m. This window pairs with your lunch walk back from Pirates.',
    type: 'll',
  },
  {
    id: 'op2',
    ride: 'Big Thunder Mountain',
    land: 'Frontierland',
    window: '2:15 – 3:15',
    savedMin: 40,
    reason: 'Back-to-back with Splash means one walk, two thrills — saves the Frontierland backtrack.',
    type: 'll',
  },
  {
    id: 'op3',
    ride: 'Tron Lightcycle Run',
    land: 'Tomorrowland',
    window: '4:00 – 5:00',
    savedMin: 90,
    reason: 'ILL — premium pass. Tron is the day\'s most-voted ride and standby is 110m.',
    type: 'ill',
  },
];

interface NextLLMoveProps {
  visible: boolean;
  tier?: ServiceTier;
}

const NextLLMove = ({ visible, tier = 'manager' }: NextLLMoveProps) => {
  const { celebrate } = useCelebrate();
  const [securedIds, setSecuredIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Ranked by minutes saved — the AI's recommendation order.
  const ranked = useMemo(
    () => [...POOL].sort((a, b) => b.savedMin - a.savedMin).filter(o => !securedIds.has(o.id)),
    [securedIds]
  );

  // Sovereign = invisible (autonomous). Explorer = soft upsell handled elsewhere.
  if (!visible || tier === 'sovereign') return null;

  if (tier === 'explorer') {
    return (
      <div className="rounded-2xl px-5 py-4 text-center" style={{ backgroundColor: 'hsl(var(--gold) / 0.08)', border: '1px dashed hsl(var(--gold) / 0.4)' }}>
        <p className="font-sans text-[11px]" style={{ color: 'hsl(var(--gold))' }}>
          <Zap size={10} className="inline mr-1" />
          Lightning Lane management is a Manager tier feature.
        </p>
      </div>
    );
  }

  const next = ranked[0];
  const rest = ranked.slice(1);

  if (!next) {
    return (
      <div className="bg-card rounded-2xl px-5 py-4 flex items-center gap-3" style={{ boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)' }}>
        <Check size={14} className="text-accent shrink-0" />
        <span className="font-sans italic text-[12px] text-foreground/70">
          You've secured every Lightning Lane worth chasing today. Keep walking.
        </span>
      </div>
    );
  }

  const secure = (op: LLOpportunity) => {
    setSecuredIds(prev => new Set(prev).add(op.id));
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Secured');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          The Next Lightning Lane Move
        </span>
        <span className="font-sans text-[9px] tabular-nums" style={{ color: 'hsl(var(--gold))' }}>
          {ranked.length} ranked
        </span>
      </div>

      {/* THE recommendation — one decision, fully reasoned */}
      <AnimatePresence mode="wait">
        <motion.article
          key={next.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="bg-card rounded-2xl p-5"
          style={{
            boxShadow: '0 0 0 1px hsl(var(--gold) / 0.25), 0 12px 32px hsl(var(--obsidian) / 0.08)',
          }}
        >
          {/* Eyebrow — gold, with type chip */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-[9px] uppercase tracking-sovereign font-bold flex items-center gap-1.5" style={{ color: 'hsl(var(--gold))' }}>
              <Zap size={11} />
              {next.type === 'ill' ? 'Premium ILL' : 'Standard LL'} · Recommended
            </span>
            <span className="font-sans text-[10px] tabular-nums font-bold" style={{ color: 'hsl(var(--gold))' }}>
              save {next.savedMin}m
            </span>
          </div>

          {/* Ride name */}
          <h3 className="font-display text-[20px] leading-tight text-foreground">
            {next.ride}
          </h3>
          <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
            {next.land} · window {next.window}
          </p>

          {/* The reason — italic, mental-load relief */}
          <p className="font-sans italic text-[12px] text-foreground/75 mt-3 leading-snug">
            {next.reason}
          </p>

          {/* Single decisive CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => secure(next)}
            className="w-full mt-4 bg-primary text-primary-foreground rounded-2xl py-3.5 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[48px] font-sans text-sm font-semibold"
          >
            Secure this window
            <ChevronRight size={16} />
          </motion.button>
        </motion.article>
      </AnimatePresence>

      {/* Disclosure — full backlog only when asked */}
      {rest.length > 0 && (
        <div className="mt-2.5">
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full bg-transparent border-none cursor-pointer py-2 px-1 flex items-center justify-between"
          >
            <span className="font-sans text-[10px] text-muted-foreground">
              {showAll ? 'Hide' : 'Show'} {rest.length} more {rest.length === 1 ? 'option' : 'options'}
            </span>
            <ChevronRight
              size={12}
              className="text-muted-foreground transition-transform"
              style={{ transform: showAll ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </button>

          <AnimatePresence>
            {showAll && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden list-none p-0 m-0 space-y-1.5"
              >
                {rest.map((op, i) => (
                  <li
                    key={op.id}
                    className="bg-card/70 rounded-xl px-3.5 py-2.5 flex items-center gap-3"
                    style={{ boxShadow: '0 4px 12px hsl(var(--obsidian) / 0.03)' }}
                  >
                    <span
                      className="font-display text-[14px] tabular-nums w-5 text-center"
                      style={{ color: 'hsl(var(--gold))' }}
                    >
                      {i + 2}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[13px] leading-tight text-foreground truncate">
                        {op.ride}
                      </p>
                      <p className="font-sans text-[9px] text-muted-foreground tabular-nums">
                        {op.window} · save {op.savedMin}m
                      </p>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NextLLMove;
