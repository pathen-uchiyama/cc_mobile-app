import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight, Users, Check, Utensils, Sparkles } from 'lucide-react';
import EngagementRibbon from './EngagementRibbon';

interface FocusMoveProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  /** Party poll: how many of the traveling party flagged this as a must-do. */
  party?: { yes: number; total: number };
  ctaLabel?: string;
  onCommit?: () => void;
  /** Keepsake prompt — shown in the Memory Ribbon (bottom). */
  questPrompt?: string;
  /** Quest type drives the icon + verb on the capture button. */
  questType?: 'photo' | 'voice';
  onCaptureMemory?: () => void;
  /** Find & Seek action — right side of the Engagement Ribbon. */
  onFindAndSeek?: () => void;
  /** When true, the system has detected a strategic pivot opportunity. */
  pivotSuggested?: boolean;
  /** Headline for the pivot suggestion (Publico Headline). */
  pivotHeadline?: string;
  /** When true, the card is one of the user's Must-Do attractions — gold border. */
  mustDo?: boolean;
  /** Mark this Hero as completed/seen — removes it from the stack. */
  onComplete?: () => void;
  /**
   * "On the Books" — the next dining or experience hold within the hour.
   * Surfaces a thin gold chip above Right Now. Tap opens the Strategic Dashboard.
   */
  upcomingHold?: {
    kind: 'dining' | 'experience';
    name: string;
    minutesAway: number;
    walkMinutes?: number;
  };
  onUpcomingHoldTap?: () => void;
}

/**
 * Dual-Purpose Focus Card — the ONLY decision on screen.
 *
 *  ┌───────────────────────────────┐
 *  │  TOP HALF · Tactical          │
 *  │  Attraction · Wait · Secure   │
 *  ├───────────────────────────────┤
 *  │  BOTTOM HALF · Engagement     │
 *  │  Grand Quest + Capture        │
 *  └───────────────────────────────┘
 *
 * Top half is logistics (where + when + LL).
 * Bottom half is the boutique brand soul — the "why" of being there.
 */
const FocusMove = ({
  attraction,
  location,
  logic,
  wait,
  party,
  ctaLabel = 'On Our Way',
  onCommit,
  questPrompt,
  questType: _questType = 'photo',
  onCaptureMemory,
  onFindAndSeek,
  pivotSuggested = false,
  pivotHeadline = 'A New Path is Available',
  mustDo = false,
  onComplete,
  upcomingHold,
  onUpcomingHoldTap,
}: FocusMoveProps) => {
  // Boutique Shadow — heavy Deep Obsidian at 10% opacity per spec.
  // Must-Do cards add a Burnished Gold border ring.
  const ring = mustDo
    ? '0 0 0 2px hsl(var(--gold) / 0.85), '
    : '0 0 0 1px hsl(var(--gold) / 0.08), ';
  const boxShadow =
    `${ring}0 4px 8px hsl(var(--obsidian) / 0.04), 0 24px 48px -8px hsl(var(--obsidian) / 0.10), 0 48px 96px -16px hsl(var(--obsidian) / 0.10)`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative bg-card w-full overflow-hidden flex flex-col h-full"
      style={{ borderRadius: '16px', boxShadow }}
    >
      {/* Burnished Gold pulse — surfaces when the system detects a strategic pivot */}
      {pivotSuggested && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: '16px', boxShadow: '0 0 0 2px hsl(36 47% 35% / 0.55)' }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />
      )}

      {/* Pivot Suggestion banner — Publico Headline */}
      {pivotSuggested && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(180deg, hsl(36 47% 35% / 0.14) 0%, hsl(36 47% 35% / 0.04) 100%)',
            borderBottom: '1px solid hsl(36 47% 35% / 0.35)',
          }}
        >
          <span
            className="font-sans text-[8px] uppercase tracking-sovereign font-bold block mb-0.5"
            style={{ color: 'hsl(36 47% 35%)', letterSpacing: '0.16em' }}
          >
            The Pulse has Shifted
          </span>
          <p
            className="font-display text-[16px] leading-tight text-foreground"
            style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
          >
            {pivotHeadline}
          </p>
        </motion.div>
      )}

      {/* ─── TOP HALF · TACTICAL ─── (24px no-bleed padding) — flex-1 so the
          card fills its slot and the Engagement Ribbon hugs the bottom. */}
      <div className="flex-1 p-6 pb-5" style={{ padding: '24px', paddingBottom: '20px' }}>
        {/* On the Books — next dining/experience hold within the hour */}
        {upcomingHold && (
          <button
            type="button"
            onClick={onUpcomingHoldTap}
            className="w-full flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-85"
            style={{
              background: 'hsl(var(--gold) / 0.10)',
              border: '1px solid hsl(var(--gold) / 0.25)',
            }}
            aria-label={`On the Books: ${upcomingHold.name} in ${upcomingHold.minutesAway} minutes`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {upcomingHold.kind === 'dining' ? (
                <Utensils size={12} style={{ color: 'hsl(var(--gold))' }} />
              ) : (
                <Sparkles size={12} style={{ color: 'hsl(var(--gold))' }} />
              )}
              <span
                className="font-sans text-[9px] uppercase tracking-sovereign font-bold shrink-0"
                style={{ color: 'hsl(var(--gold))', letterSpacing: '0.14em' }}
              >
                On the Books
              </span>
              <span className="font-sans text-[11px] text-foreground truncate min-w-0">
                {upcomingHold.name}
              </span>
            </div>
            <span className="font-sans text-[10px] text-muted-foreground tabular-nums shrink-0">
              {upcomingHold.minutesAway}m
              {upcomingHold.walkMinutes !== undefined ? ` · ${upcomingHold.walkMinutes}m walk` : ''}
            </span>
          </button>
        )}

        <div className="flex items-start justify-between mb-4 gap-2">
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold flex items-center gap-1.5">
            <motion.span
              className="inline-block w-2 h-2 bg-accent rounded-full"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            Right Now
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {wait && (
              <div className="flex items-center gap-1.5 bg-accent/15 px-3 py-1.5 rounded-full">
                <Clock size={12} className="text-accent" />
                <span className="font-sans text-sm text-accent font-bold tabular-nums">
                  {wait}
                </span>
              </div>
            )}
            {onComplete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onComplete}
                aria-label={`Mark ${attraction} as done`}
                title="Mark done"
                className="flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full"
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid hsl(var(--gold) / 0.4)',
                  color: 'hsl(var(--gold))',
                }}
              >
                <Check size={14} strokeWidth={2.2} />
              </motion.button>
            )}
          </div>
        </div>

        <h2
          className="font-display text-[28px] leading-[1.05] text-foreground mb-2"
          style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
        >
          {attraction}
        </h2>

        {/* Strategic Logic — the "why this, why now" line. Inter Italic. */}
        <div
          className="mb-4 pl-3"
          style={{ borderLeft: '2px solid hsl(var(--gold) / 0.5)' }}
        >
          <span
            className="font-sans not-italic text-[8px] uppercase tracking-sovereign font-bold block mb-0.5"
            style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
          >
            Strategic Logic
          </span>
          <p className="font-sans italic text-[14px] text-foreground/80 leading-snug">
            {logic}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={11} className="text-muted-foreground" />
            <span className="font-sans text-[11px] text-muted-foreground truncate">
              {location}
            </span>
          </div>
          {party !== undefined && (
            <div
              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--gold) / 0.12)' }}
              title={`${party.yes} of ${party.total} in your party flagged this a must-do`}
            >
              <Users size={10} style={{ color: 'hsl(var(--gold))' }} />
              <span
                className="font-sans text-[10px] font-bold tabular-nums"
                style={{ color: 'hsl(var(--gold))' }}
              >
                {party.yes} of {party.total} want this
              </span>
            </div>
          )}
        </div>

        {/* Single primary action — Lightning Lanes are NEVER manually grabbed here.
            They are surfaced exclusively via the Contextual Booking Drawer when the
            strategy engine finds a path that fits the day. */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCommit}
          className="w-full bg-primary text-primary-foreground py-4 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[56px] font-sans text-sm font-semibold tracking-wide"
          style={{ borderRadius: '16px' }}
        >
          {ctaLabel}
          <ArrowRight size={16} />
        </motion.button>

        {questPrompt && (
          <p
            className="font-sans italic text-[13px] leading-snug mt-4 pt-4"
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

      <EngagementRibbon onCaptureMemory={onCaptureMemory} onFindAndSeek={onFindAndSeek} />
    </motion.article>
  );
};

export default FocusMove;
