import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight, Users, Camera, Compass, Search } from 'lucide-react';

interface FocusMoveProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  /** Party poll: how many of the traveling party flagged this as a must-do. */
  party?: { yes: number; total: number };
  ctaLabel?: string;
  onCommit?: () => void;
  /** Tactical: secures the next Lightning Lane window for this walk. */
  onSecureLL?: () => void;
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
  onSecureLL,
  questPrompt,
  questType = 'photo',
  onCaptureMemory,
  onFindAndSeek,
  pivotSuggested = false,
  pivotHeadline = 'A New Path is Available',
}: FocusMoveProps) => {
  const QuestIcon = questType === 'photo' ? Camera : Compass;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative bg-card w-full overflow-hidden"
      style={{
        borderRadius: '16px',
        boxShadow:
          '0 0 0 1px hsl(var(--gold) / 0.08), 0 2px 4px hsl(var(--obsidian) / 0.04), 0 18px 12px -8px hsl(220 20% 10% / 0.18), 0 32px 64px -12px hsl(220 20% 10% / 0.22)',
      }}
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

      {/* ─── TOP HALF · TACTICAL ─── (24px no-bleed padding) */}
      <div className="p-6 pb-5" style={{ padding: '24px', paddingBottom: '20px' }}>
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

      {/* ─── ENGAGEMENT RIBBON · 50/50 split, full-width, 54px touch targets ─── */}
      <div
        className="grid grid-cols-2"
        style={{
          borderTop: '1px solid hsl(36 47% 35% / 0.35)',
          background: 'linear-gradient(180deg, hsl(36 47% 35% / 0.08) 0%, hsl(36 47% 35% / 0.02) 100%)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCaptureMemory}
          className="flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign"
          style={{
            minHeight: '54px',
            color: 'hsl(36 47% 35%)',
            borderRight: '1px solid hsl(36 47% 35% / 0.35)',
          }}
          aria-label="Record Memory"
        >
          <QuestIcon size={14} />
          Record Memory
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onFindAndSeek}
          className="flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign"
          style={{
            minHeight: '54px',
            color: 'hsl(36 47% 35%)',
          }}
          aria-label="Initiate Seek"
        >
          <Search size={14} />
          Initiate Seek
        </motion.button>
      </div>
    </motion.article>
  );
};

export default FocusMove;
