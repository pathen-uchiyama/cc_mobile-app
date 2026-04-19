import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight } from 'lucide-react';

interface HeroCardProps {
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  ctaLabel?: string;
  onCommit?: () => void;
}

/**
 * The Focus Card — Priority 1.
 *
 * 100% width, elevated boutique shadow. The ONLY card with an active CTA.
 * Anchored inside the top 40% of the screen.
 */
const HeroCard = ({
  attraction,
  location,
  logic,
  wait,
  ctaLabel = 'On Our Way',
  onCommit,
}: HeroCardProps) => {
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
      {/* Eyebrow + live wait pill */}
      <div className="flex items-start justify-between mb-4">
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold flex items-center gap-1.5">
          <motion.span
            className="inline-block w-2 h-2 bg-accent rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          The Focus
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

      {/* Attraction name — Playfair 24px */}
      <h2 className="font-display text-[24px] leading-[1.15] text-foreground mb-2">
        {attraction}
      </h2>

      {/* Logic Whisper — Inter italic 14px */}
      <p className="font-sans italic text-[14px] text-foreground/75 leading-snug mb-4">
        {logic}
      </p>

      {/* Location row */}
      <div className="flex items-center gap-1.5 mb-5">
        <MapPin size={11} className="text-muted-foreground" />
        <span className="font-sans text-[11px] text-muted-foreground">{location}</span>
      </div>

      {/* Primary CTA — Deep Obsidian, 16px corners, thumb-zone */}
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

export default HeroCard;
