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
  /** Party poll: how many of the traveling party flagged this. */
  party?: { yes: number; total: number };
  /** Keepsake prompt for the Memory Ribbon. */
  questPrompt?: string;
  onCaptureMemory?: () => void;
  /** Find & Seek action — right side of the Engagement Ribbon. */
  onFindAndSeek?: () => void;
}

/**
 * Dual-Purpose Horizon Card — Priority 2 & 3.
 *
 * Top half = Tactical (rank/time/attraction/wait).
 * Bottom half = Engagement Zone (Grand Quest), revealed on expand.
 */
const HorizonCard = ({
  rank, time, attraction, logic, wait, llSecured, depth = 1, party,
  questPrompt, onCaptureMemory, onFindAndSeek,
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
        // Horizon = recessed; lighter shadow to sit "below" the Hero
        boxShadow: '0 2px 6px hsl(var(--obsidian) / 0.04), 0 8px 16px -8px hsl(var(--obsidian) / 0.06)',
        opacity: 0.94,
      }}
    >
      {/* TACTICAL row — 24px horizontal no-bleed padding */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-transparent border-none p-0 cursor-pointer text-left"
        style={{ padding: '16px 24px' }}
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
            {party !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <Users size={9} style={{ color: 'hsl(var(--gold))' }} />
                <span
                  className="font-sans text-[9px] font-semibold tabular-nums"
                  style={{ color: 'hsl(var(--gold))' }}
                >
                  {party.yes} of {party.total} want this
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

      {/* ENGAGEMENT ZONE — logic + Keepsake whisper, revealed on expand */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div style={{ padding: '0 24px 16px 24px' }}>
              <p className="font-sans italic text-[12px] leading-snug" style={{ color: 'hsl(var(--slate-plaid))' }}>
                {logic}
              </p>
              {questPrompt && (
                <p
                  className="font-sans italic text-[12px] leading-snug mt-3 pt-3"
                  style={{
                    color: 'hsl(36 47% 35%)',
                    borderTop: '1px dashed hsl(36 47% 35% / 0.35)',
                  }}
                >
                  <span className="font-sans not-italic text-[8px] uppercase tracking-sovereign font-bold block mb-1" style={{ letterSpacing: '0.14em' }}>
                    A Keepsake
                  </span>
                  {questPrompt}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No engagement ribbon on Horizon cards — they are scannable previews.
          Memory + Find & Seek surface only on the Hero card to avoid repetition. */}
    </motion.article>
  );
};

export default HorizonCard;
