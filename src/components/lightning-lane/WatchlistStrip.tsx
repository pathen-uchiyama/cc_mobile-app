import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Eye, Check, Zap } from 'lucide-react';
import {
  LL_INVENTORY,
  formatCountdown,
  type LLAttraction,
} from '@/data/lightningLanes';
import type { WatchEntry } from '@/hooks/lightning-lane/useLLWatchlist';
import type { ServiceTier } from '@/contexts/CompanionContext';
import { BURNISHED_GOLD } from '@/pages/BookLightningLane';

interface WatchlistStripProps {
  entries: WatchEntry[];
  nowMinutes: number;
  tier: ServiceTier;
  onUnwatch: (attractionId: string) => void;
  onBookNow: (attraction: LLAttraction) => void;
  onRearm: (attractionId: string, openAtMin: number) => void;
  /** Default re-arm delay, applied when the guest "snoozes" a missed entry. */
  rearmDelayMin?: number;
}

/**
 * WatchlistStrip — the at-a-glance summary of every lane the guest has
 * pre-selected. Sits directly under the page header so it's the first thing
 * a returning guest sees: "here's what I'm watching, here's the countdown,
 * here's what's ready to book right now."
 *
 * Sort is intentional:
 *   1. alerted   — needs action *right now*, magenta border
 *   2. watching  — countdown still running, ordered by soonest
 *   3. booked    — successful auto-bookings, dimmed but kept briefly
 *   4. missed    — the guest didn't act in time, sunk to the bottom
 */
const WatchlistStrip = ({
  entries,
  nowMinutes,
  tier,
  onUnwatch,
  onBookNow,
  onRearm,
  rearmDelayMin = 30,
}: WatchlistStripProps) => {
  if (entries.length === 0) return null;

  const order: Record<WatchEntry['status'], number> = {
    alerted: 0,
    watching: 1,
    booked: 2,
    missed: 3,
  };
  const sorted = [...entries].sort((a, b) => {
    const so = order[a.status] - order[b.status];
    if (so !== 0) return so;
    return a.openAtMin - b.openAtMin;
  });

  const autoBookCopy = tier === 'sovereign' || tier === 'manager';

  return (
    <section
      className="mb-4 rounded-2xl p-3 bg-card"
      // Outer "watching collection" surface — consumes the canonical
      // BURNISHED_GOLD pair so this strip, the watching RideRow on
      // /book-ll, and any future watching surface all share one outline
      // recipe. Drift here used to be silent; it's now test-locked.
      style={{
        border: BURNISHED_GOLD.borderWatching,
        boxShadow: BURNISHED_GOLD.glowWatching,
      }}
      aria-label="Lightning Lane watchlist"
    >
      <header className="flex items-center justify-between mb-2 px-1">
        <span className="flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-sovereign font-bold" style={{ color: 'hsl(var(--gold))' }}>
          <Eye size={10} /> Watching
        </span>
        <span className="font-sans text-[9px] text-muted-foreground">
          {autoBookCopy ? 'Auto-books at open' : 'Alerts you at open'}
        </span>
      </header>

      <ul className="list-none p-0 m-0 space-y-1.5">
        <AnimatePresence initial={false}>
          {sorted.map((entry) => {
            const attraction = LL_INVENTORY.find((a) => a.id === entry.attractionId);
            if (!attraction) return null;
            const minsUntil = entry.openAtMin - nowMinutes;
            return (
              <motion.li
                key={entry.attractionId}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                style={{
                  backgroundColor:
                    entry.status === 'alerted'
                      ? 'hsl(316 95% 35% / 0.06)'
                      : entry.status === 'booked'
                        ? 'hsl(var(--accent) / 0.08)'
                        : entry.status === 'missed'
                          ? 'hsl(var(--obsidian) / 0.04)'
                          : 'hsl(var(--obsidian) / 0.02)',
                  border:
                    entry.status === 'alerted'
                      ? '1px solid hsl(316 95% 35% / 0.45)'
                      : '1px solid hsl(var(--obsidian) / 0.06)',
                  opacity: entry.status === 'missed' ? 0.65 : 1,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[12px] font-semibold text-foreground truncate">
                    {attraction.name}
                  </p>
                  <p className="font-sans text-[10px] mt-0.5 tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
                    {entry.status === 'watching' && `Opens in ${formatCountdown(Math.max(0, minsUntil))}`}
                    {entry.status === 'alerted' && (
                      <span className="font-bold" style={{ color: 'hsl(316 95% 35%)' }}>
                        Open now — tap to book
                      </span>
                    )}
                    {entry.status === 'booked' && (
                      <span className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>
                        Auto-booked
                      </span>
                    )}
                    {entry.status === 'missed' && 'Window passed — re-arm?'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {entry.status === 'alerted' && (
                    <button
                      type="button"
                      onClick={() => onBookNow(attraction)}
                      className="rounded-lg px-2.5 py-1.5 border-none cursor-pointer font-sans text-[10px] font-bold flex items-center gap-1 min-h-[32px]"
                      style={{
                        backgroundColor: 'hsl(316 95% 35%)',
                        color: 'hsl(var(--parchment))',
                      }}
                      aria-label={`Book ${attraction.name} now`}
                    >
                      <Bell size={10} /> Book
                    </button>
                  )}
                  {entry.status === 'booked' && (
                    <span
                      className="rounded-lg px-2 py-1 font-sans text-[10px] font-bold flex items-center gap-1"
                      style={{
                        backgroundColor: 'hsl(var(--accent) / 0.18)',
                        color: 'hsl(var(--accent))',
                      }}
                      aria-label="Booked"
                    >
                      <Check size={10} /> Held
                    </span>
                  )}
                  {entry.status === 'missed' && (
                    <button
                      type="button"
                      onClick={() => onRearm(entry.attractionId, nowMinutes + rearmDelayMin)}
                      className="rounded-lg px-2 py-1 bg-transparent border cursor-pointer font-sans text-[10px] font-semibold min-h-[28px]"
                      style={{
                        borderColor: 'hsl(var(--obsidian) / 0.12)',
                        color: 'hsl(var(--slate-plaid))',
                      }}
                      aria-label={`Re-arm watch for ${attraction.name}`}
                    >
                      <Zap size={10} className="inline" /> Re-arm
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUnwatch(entry.attractionId)}
                    className="rounded-lg p-1.5 bg-transparent border-none cursor-pointer flex items-center justify-center"
                    style={{ color: 'hsl(var(--slate-plaid))' }}
                    aria-label={`Stop watching ${attraction.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
};

export default WatchlistStrip;