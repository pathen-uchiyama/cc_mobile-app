import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight, Users } from 'lucide-react';

interface FocusMoveProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  votes?: number;
  ctaLabel?: string;
  onCommit?: () => void;
}

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

/**
 * The Focus Move — the ONLY decision on screen.
 *
 * Merges the Hero (where you're going) and the Next LL Move
 * (what to grab while you walk) into one card. One scroll, one decision.
 */
const FocusMove = ({
  attraction,
  location,
  logic,
  wait,
  votes,
  ctaLabel = 'On Our Way',
  onCommit,
}: FocusMoveProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative bg-card rounded-2xl p-6 w-full"
      style={{
        boxShadow:
          '0 0 0 1px hsl(var(--obsidian) / 0.04), 0 24px 60px hsl(var(--obsidian) / 0.12)',
      }}
    >
      {/* Eyebrow + live wait */}
      <div className="flex items-start justify-between mb-4">
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold flex items-center gap-1.5">
          <motion.span
            className="inline-block w-2 h-2 bg-accent rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          Right Now
        </span>
        {wait && (
          <div className="flex items-center gap-1.5 bg-accent/15 px-3 py-1.5 rounded-full">
            <Clock size={12} className="text-accent" />
            <span className="font-sans text-sm text-accent font-bold tabular-nums">
              {wait}
            </span>
          </div>
        )}
      </div>

      {/* Attraction — Publico Headline (Playfair fallback) */}
      <h2
        className="font-display text-[28px] leading-[1.05] text-foreground mb-2"
        style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
      >
        {attraction}
      </h2>

      {/* Logic Whisper — Inter Italic */}
      <p className="font-sans italic text-[14px] text-foreground/75 leading-snug mb-4">
        {logic}
      </p>

      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={11} className="text-muted-foreground" />
          <span className="font-sans text-[11px] text-muted-foreground truncate">
            {location}
          </span>
        </div>
        {votes !== undefined && (
          <div
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'hsl(var(--gold) / 0.12)' }}
            title={`${votes.toLocaleString()} guests voted this a priority today`}
          >
            <Users size={10} style={{ color: 'hsl(var(--gold))' }} />
            <span
              className="font-sans text-[10px] font-bold tabular-nums"
              style={{ color: 'hsl(var(--gold))' }}
            >
              {formatVotes(votes)} voted
            </span>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCommit}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[52px] font-sans text-sm font-semibold tracking-wide"
      >
        {ctaLabel}
        <ArrowRight size={16} />
      </motion.button>
    </motion.article>
  );
};

export default FocusMove;
