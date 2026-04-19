import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Users, X } from 'lucide-react';

interface FootRide {
  id: string;
  name: string;
  votes: number;
}

const RIDES: FootRide[] = [
  { id: 'r1', name: 'Tron Lightcycle Run', votes: 4_812 },
  { id: 'r2', name: 'Seven Dwarfs Mine Train', votes: 3_647 },
  { id: 'r3', name: 'Space Mountain', votes: 2_984 },
  { id: 'r4', name: 'Big Thunder Mountain', votes: 2_215 },
  { id: 'r5', name: 'Pirates of the Caribbean', votes: 1_708 },
];

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

/**
 * Priority Footnote — a single tappable line.
 *
 * Replaces the spreadsheet-style ride list. The full ranking
 * lives behind a tap so it's reference, not chrome.
 */
const PriorityFootnote = () => {
  const [open, setOpen] = useState(false);
  const top = RIDES.slice(0, 3).map((r) => r.name.split(' ')[0]).join(' · ');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-transparent border-none cursor-pointer flex items-center gap-2 py-2 px-1 text-left"
      >
        <span
          className="font-sans text-[10px] uppercase tracking-sovereign font-semibold shrink-0"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          Today's most-wanted
        </span>
        <span
          className="font-sans italic text-[11px] flex-1 min-w-0 truncate"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          {top}
        </span>
        <ChevronRight size={12} style={{ color: 'hsl(var(--slate-plaid))' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'hsl(var(--obsidian) / 0.4)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] bg-background rounded-t-3xl p-6 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                    Voted by guests today
                  </span>
                  <h3 className="font-display text-[20px] text-foreground mt-1">
                    Today's most-wanted
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="bg-transparent border-none cursor-pointer p-1"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <ol className="list-none p-0 m-0 space-y-3">
                {RIDES.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span
                      className="font-display text-[16px] tabular-nums w-6 shrink-0"
                      style={{ color: 'hsl(var(--gold))' }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-display text-[15px] text-foreground flex-1 min-w-0 truncate">
                      {r.name}
                    </span>
                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10">
                      <Users size={10} className="text-accent" />
                      <span className="font-sans text-[11px] font-bold text-accent tabular-nums">
                        {formatVotes(r.votes)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PriorityFootnote;
