import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, ArrowUp, Minus, Plus, Check } from 'lucide-react';

export interface MustDoEntry {
  id: string;
  attraction: string;
  /** Whether this Must-Do is currently in the visible 3-card stack. */
  inStack?: boolean;
  /** Total rides desired (e.g. 2 = ride twice today). Defaults to 1. */
  desired?: number;
  /** Rides completed so far. Defaults to 0. */
  done?: number;
}

interface MustDoDropdownProps {
  items: MustDoEntry[];
  /** Called when the user picks an off-stack Must-Do — promotes it into the Hero slot. */
  onPromote?: (mustDoId: string, attraction: string) => void;
  /** Called when the user adjusts the desired ride count for a Must-Do. */
  onAdjustDesired?: (mustDoId: string, nextDesired: number) => void;
}

/**
 * Must-Do Dropdown — surfaces Must-Dos that are NOT currently in the
 * Sovereign Stack AND have remaining rides to take (done < desired).
 *
 * Each row shows:
 *  - Attraction name
 *  - A − / count / + stepper for re-rides (managed counts come from survey)
 *  - A "promote to Hero" arrow. Disabled when fully complete.
 */
const MustDoDropdown = ({ items, onPromote, onAdjustDesired }: MustDoDropdownProps) => {
  const [open, setOpen] = useState(false);

  // Off-stack: not currently in stack. Includes both pending and "fully done"
  // so the user can bump the count and re-ride. We sort fully-done to the bottom.
  const offStack = items
    .filter((i) => !i.inStack)
    .sort((a, b) => {
      const aDone = (a.done ?? 0) >= (a.desired ?? 1);
      const bDone = (b.done ?? 0) >= (b.desired ?? 1);
      return Number(aDone) - Number(bDone);
    });

  if (offStack.length === 0) return null;

  const remainingRides = offStack.reduce(
    (s, i) => s + Math.max(0, (i.desired ?? 1) - (i.done ?? 0)),
    0,
  );

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer px-3 py-2"
        style={{
          borderRadius: '10px',
          background: 'hsl(var(--gold) / 0.04)',
          border: '1px solid hsl(var(--gold) / 0.18)',
        }}
        aria-expanded={open}
        aria-label="Other Must-Do attractions"
      >
        <span
          className="font-sans text-[10px] uppercase tracking-sovereign font-semibold"
          style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
        >
          {remainingRides > 0
            ? `${remainingRides} ride${remainingRides === 1 ? '' : 's'} on deck`
            : `${offStack.length} attraction${offStack.length === 1 ? '' : 's'} · all rides done`}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'hsl(var(--gold))' }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="list-none m-0 p-0 overflow-hidden"
          >
            <div className="pt-2 flex flex-col gap-1.5">
              {offStack.map((it) => {
                const desired = Math.max(1, it.desired ?? 1);
                const done = Math.max(0, it.done ?? 0);
                const remaining = Math.max(0, desired - done);
                const fullyDone = remaining === 0;

                return (
                  <motion.li key={it.id} className="list-none">
                    <div
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5"
                      style={{
                        borderRadius: '8px',
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--obsidian) / 0.06)',
                        opacity: fullyDone ? 0.7 : 1,
                      }}
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        {fullyDone ? (
                          <Check size={11} style={{ color: 'hsl(var(--gold))' }} strokeWidth={2.4} />
                        ) : (
                          <Star size={11} style={{ color: 'hsl(var(--gold))' }} />
                        )}
                        <span className="font-sans text-[12px] text-foreground truncate">
                          {it.attraction}
                        </span>
                      </span>

                      {/* Ride-count stepper — shows count + adjust controls */}
                      <div
                        className="shrink-0 flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease desired rides for ${it.attraction}`}
                          disabled={desired <= 1}
                          onClick={() => onAdjustDesired?.(it.id, desired - 1)}
                          className="flex items-center justify-center bg-transparent cursor-pointer rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '1px solid hsl(var(--gold) / 0.4)',
                            color: 'hsl(var(--gold))',
                          }}
                        >
                          <Minus size={10} strokeWidth={2.4} />
                        </button>
                        <span
                          className="font-sans text-[10px] font-bold tabular-nums px-1.5"
                          style={{ color: 'hsl(var(--gold))', minWidth: '28px', textAlign: 'center' }}
                          title={`${done} of ${desired} done`}
                        >
                          {done}/{desired}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase desired rides for ${it.attraction}`}
                          onClick={() => onAdjustDesired?.(it.id, desired + 1)}
                          className="flex items-center justify-center bg-transparent cursor-pointer rounded-full"
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '1px solid hsl(var(--gold) / 0.4)',
                            color: 'hsl(var(--gold))',
                          }}
                        >
                          <Plus size={10} strokeWidth={2.4} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onPromote?.(it.id, it.attraction);
                          setOpen(false);
                        }}
                        disabled={fullyDone}
                        aria-label={
                          fullyDone
                            ? `${it.attraction} — all rides complete. Tap + to add another.`
                            : `Promote ${it.attraction} to the main card`
                        }
                        className="shrink-0 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          width: '28px',
                          height: '28px',
                          color: 'hsl(var(--gold))',
                        }}
                      >
                        <ArrowUp size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MustDoDropdown;
