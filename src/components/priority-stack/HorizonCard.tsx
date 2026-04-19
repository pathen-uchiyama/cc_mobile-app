import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Users, Camera } from 'lucide-react';

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
  /** Grand Quest prompt for the Engagement Zone. */
  questPrompt?: string;
  onCaptureMemory?: () => void;
}

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

/**
 * Dual-Purpose Horizon Card — Priority 2 & 3.
 *
 * Top half = Tactical (rank/time/attraction/wait).
 * Bottom half = Engagement Zone (Grand Quest), revealed on expand.
 */
const HorizonCard = ({
  rank, time, attraction, logic, wait, llSecured, depth = 1, votes,
  questPrompt, onCaptureMemory,
}: HorizonCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: depth * 0.08 }}
      className="bg-card mx-auto overflow-hidden"
      style={{
        width: '100%',
        borderRadius: '16px',
        boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)',
      }}
    >
      {/* TACTICAL row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-transparent border-none p-0 cursor-pointer text-left px-5 py-3.5"
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
            <h3
              className="font-display text-[17px] leading-tight text-foreground truncate"
              style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
            >
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
      </button>

      {/* ENGAGEMENT ZONE — Gold-bordered Grand Quest, revealed on expand */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              <p className="font-sans italic text-[12px] leading-snug mb-3" style={{ color: 'hsl(var(--slate-plaid))' }}>
                {logic}
              </p>

              {questPrompt && (
                <div
                  className="p-3"
                  style={{
                    borderRadius: '16px',
                    border: '1.5px solid hsl(var(--gold) / 0.5)',
                    background:
                      'linear-gradient(180deg, hsl(var(--gold) / 0.06) 0%, hsl(var(--gold) / 0.02) 100%)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Camera size={10} style={{ color: 'hsl(var(--gold))' }} />
                    <span
                      className="font-sans text-[7px] uppercase tracking-sovereign font-bold"
                      style={{ color: 'hsl(var(--gold))' }}
                    >
                      Grand Quest
                    </span>
                  </div>
                  <p
                    className="font-display text-[13px] leading-snug text-foreground mb-2"
                    style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
                  >
                    {questPrompt}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCaptureMemory?.();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-transparent cursor-pointer font-sans text-[10px] font-semibold uppercase tracking-sovereign min-h-[36px]"
                    style={{
                      borderRadius: '16px',
                      border: '1px solid hsl(var(--gold) / 0.4)',
                      color: 'hsl(var(--gold))',
                    }}
                  >
                    <Camera size={11} />
                    Capture Memory
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default HorizonCard;
