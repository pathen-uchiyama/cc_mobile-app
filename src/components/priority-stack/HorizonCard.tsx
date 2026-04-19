import { motion } from 'framer-motion';
import { Zap, Users, MapPin, Clock } from 'lucide-react';

interface HorizonCardProps {
  rank: 'next' | 'later';
  time: string;
  attraction: string;
  location?: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  /** 1 = Next (slight peek), 2 = Later (deeper peek) */
  depth?: 1 | 2;
  /** Party poll: how many of the traveling party flagged this. */
  party?: { yes: number; total: number };
  /** When true, this is a Must-Do — gold border. */
  mustDo?: boolean;
  onCaptureMemory?: () => void;
  onFindAndSeek?: () => void;
}

/**
 * Horizon Card — Priority 2 & 3 in the Sovereign Stack.
 *
 * 20% smaller in height than the Hero. Always shows logic inline (no
 * expand/collapse) — the user must see why the card is in the stack.
 * Carries the same Engagement Ribbon as the Hero so Memory + Find & Seek
 * are primary touch zones on EVERY card.
 */
const HorizonCard = ({
  rank, time, attraction, location, logic, wait, llSecured, depth = 1, party,
  mustDo = false, onCaptureMemory, onFindAndSeek,
}: HorizonCardProps) => {
  const ring = mustDo
    ? '0 0 0 2px hsl(var(--gold) / 0.85), '
    : '0 0 0 1px hsl(var(--obsidian) / 0.06), ';
  const boxShadow = `${ring}0 6px 14px -6px hsl(var(--obsidian) / 0.10), 0 16px 32px -12px hsl(var(--obsidian) / 0.10)`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: depth * 0.08 }}
      className="bg-card w-full overflow-hidden flex flex-col"
      style={{ borderRadius: '16px', boxShadow }}
    >
      {/* Tactical block — compact */}
      <div style={{ padding: '14px 20px 12px 20px' }}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold tabular-nums">
            {rank === 'next' ? 'Next' : 'Later'} · {time}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {llSecured && (
              <span className="flex items-center gap-1 bg-accent/12 px-1.5 py-0.5 rounded-full">
                <Zap size={8} className="text-accent" />
                <span className="font-sans text-[7px] uppercase tracking-sovereign text-accent font-bold">LL</span>
              </span>
            )}
            {wait && (
              <span className="flex items-center gap-1">
                <Clock size={9} style={{ color: 'hsl(var(--slate-plaid))' }} />
                <span className="font-sans text-[10px] tabular-nums font-semibold" style={{ color: 'hsl(var(--slate-plaid))' }}>
                  {wait}
                </span>
              </span>
            )}
          </div>
        </div>

        <h3
          className="font-display text-[18px] leading-tight text-foreground"
          style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
        >
          {attraction}
        </h3>

        <div className="flex items-center justify-between gap-2 mt-1">
          {location && (
            <div className="flex items-center gap-1 min-w-0">
              <MapPin size={9} className="text-muted-foreground shrink-0" />
              <span className="font-sans text-[10px] text-muted-foreground truncate">
                {location}
              </span>
            </div>
          )}
          {party !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              <Users size={9} style={{ color: 'hsl(var(--gold))' }} />
              <span
                className="font-sans text-[9px] font-semibold tabular-nums"
                style={{ color: 'hsl(var(--gold))' }}
              >
                {party.yes} of {party.total}
              </span>
            </div>
          )}
        </div>

        <p
          className="font-sans italic text-[11px] leading-snug mt-2"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          {logic}
        </p>
      </div>

      {/* Engagement Ribbon — same shape as Hero, primary touch zones */}
      <EngagementRibbon onCaptureMemory={onCaptureMemory} onFindAndSeek={onFindAndSeek} />
    </motion.article>
  );
};

export default HorizonCard;
