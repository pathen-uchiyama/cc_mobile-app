import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ArrowRight, Users, Zap } from 'lucide-react';

interface LLOpportunity {
  ride: string;
  window: string;
  savedMin: number;
}

interface FocusMoveProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  votes?: number;
  ctaLabel?: string;
  onCommit?: () => void;
  /** Optional inline LL recommendation — folded into the same decision card. */
  llSuggestion?: LLOpportunity | null;
  onSecureLL?: () => void;
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
  llSuggestion,
  onSecureLL,
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

      <h2 className="font-display text-[26px] leading-[1.1] text-foreground mb-2">
        {attraction}
      </h2>

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

      {/* Inline LL fold — same card, supporting the same walk */}
      <AnimatePresence>
        {llSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-3.5"
              style={{
                backgroundColor: 'hsl(var(--gold) / 0.08)',
                border: '1px solid hsl(var(--gold) / 0.22)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} style={{ color: 'hsl(var(--gold))' }} />
                <span
                  className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
                  style={{ color: 'hsl(var(--gold))' }}
                >
                  While you walk · save {llSuggestion.savedMin}m
                </span>
              </div>
              <p className="font-sans text-[13px] text-foreground leading-snug">
                Grab a Lightning Lane for{' '}
                <span className="font-display">{llSuggestion.ride}</span> at{' '}
                <span className="tabular-nums">{llSuggestion.window}</span>?
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={onSecureLL}
                  className="flex-1 rounded-lg py-2 font-sans text-[11px] font-semibold border-none cursor-pointer"
                  style={{
                    backgroundColor: 'hsl(var(--gold))',
                    color: 'hsl(var(--obsidian))',
                  }}
                >
                  Secure it
                </button>
                <button
                  onClick={onSecureLL}
                  className="rounded-lg py-2 px-3 font-sans text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
