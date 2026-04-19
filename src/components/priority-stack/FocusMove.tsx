import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight, Users, Zap, Camera, Compass } from 'lucide-react';

interface FocusMoveProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  votes?: number;
  ctaLabel?: string;
  onCommit?: () => void;
  /** Tactical: secures the next Lightning Lane window for this walk. */
  onSecureLL?: () => void;
  /** Grand Quest prompt — shown in the Engagement Zone (bottom half). */
  questPrompt?: string;
  /** Quest type drives the icon + verb on the capture button. */
  questType?: 'photo' | 'voice';
  onCaptureMemory?: () => void;
}

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

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
  votes,
  ctaLabel = 'On Our Way',
  onCommit,
  onSecureLL,
  questPrompt,
  questType = 'photo',
  onCaptureMemory,
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
          '0 0 0 1px hsl(var(--obsidian) / 0.04), 0 24px 60px hsl(var(--obsidian) / 0.12)',
      }}
    >
      {/* ─── TOP HALF · TACTICAL ─── */}
      <div className="p-6 pb-5">
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

        {/* Attraction — Publico Headline */}
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

        <div className="flex items-center justify-between gap-2 mb-4">
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

        {/* Tactical actions — primary commit + Secure LL */}
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCommit}
            className="bg-primary text-primary-foreground py-4 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[52px] font-sans text-sm font-semibold tracking-wide"
            style={{ borderRadius: '16px' }}
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSecureLL}
            className="flex items-center justify-center gap-1.5 bg-transparent cursor-pointer min-h-[52px] font-sans text-[11px] font-semibold uppercase tracking-sovereign"
            style={{
              borderRadius: '16px',
              border: '1.5px solid hsl(var(--gold))',
              color: 'hsl(var(--gold))',
            }}
            aria-label="Secure Lightning Lane"
          >
            <Zap size={12} />
            Secure LL
          </motion.button>
        </div>
      </div>

      {/* ─── BOTTOM HALF · ENGAGEMENT ZONE (Grand Quest) ─── */}
      {questPrompt && (
        <div
          className="mx-5 mb-5 p-4"
          style={{
            borderRadius: '16px',
            border: '1.5px solid hsl(var(--gold) / 0.5)',
            background:
              'linear-gradient(180deg, hsl(var(--gold) / 0.06) 0%, hsl(var(--gold) / 0.02) 100%)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <QuestIcon size={11} style={{ color: 'hsl(var(--gold))' }} />
            <span
              className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
              style={{ color: 'hsl(var(--gold))' }}
            >
              The Grand Quest
            </span>
          </div>
          <p
            className="font-display text-[15px] leading-snug text-foreground mb-3"
            style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
          >
            {questPrompt}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCaptureMemory}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign min-h-[40px]"
            style={{
              borderRadius: '16px',
              border: '1px solid hsl(var(--gold) / 0.4)',
              color: 'hsl(var(--gold))',
            }}
          >
            <QuestIcon size={12} />
            Capture Memory
          </motion.button>
        </div>
      )}
    </motion.article>
  );
};

export default FocusMove;
