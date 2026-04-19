import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Users } from 'lucide-react';

interface HorizonCardProps {
  rank: 'next' | 'later';
  time: string;
  attraction: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  /** 1 = Next (slight peek), 2 = Later (deeper peek) */
  depth?: 1 | 2;
  /** Number of guests who voted this a priority. */
  votes?: number;
}

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

/**
 * Horizon Card — Priority 2 & 3.
 *
 * Renders at 90% width to "peek" behind the Focus card.
 * Non-interactive by default, but expandable to reveal logic.
 * Slate Plaid logic text reduces visual noise.
 */
const HorizonCard = ({
  rank, time, attraction, logic, wait, llSecured, depth = 1, votes,
}: HorizonCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: depth * 0.08 }}
      className="bg-card rounded-2xl px-5 py-3.5 mx-auto"
      style={{
        width: '90%',
        boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-transparent border-none p-0 cursor-pointer text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                {rank === 'next' ? 'Next' : 'Later'} · {time}
              </span>
              {llSecured && (
                <span className="flex items-center gap-1 bg-accent/12 px-1.5 py-0.5 rounded-full">
                  <Zap size={8} className="text-accent" />
                  <span className="font-sans text-[7px] uppercase tracking-sovereign text-accent font-bold">LL</span>
                </span>
              )}
            </div>
            <h3 className="font-display text-[17px] leading-tight text-foreground truncate">
              {attraction}
            </h3>
            {votes !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <Users size={9} style={{ color: 'hsl(var(--gold))' }} />
                <span
                  className="font-sans text-[9px] font-semibold tabular-nums"
                  style={{ color: 'hsl(var(--gold))' }}
                >
                  {formatVotes(votes)} voted priority
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {wait && (
              <span className="font-sans text-[10px] uppercase tracking-sovereign font-semibold tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
                {wait}
              </span>
            )}
            <ChevronDown
              size={14}
              className="transition-transform"
              style={{
                color: 'hsl(var(--slate-plaid))',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-sans italic text-[12px] leading-snug" style={{ color: 'hsl(var(--slate-plaid))' }}>
                {logic}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.article>
  );
};

export default HorizonCard;
