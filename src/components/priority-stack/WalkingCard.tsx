import { motion } from 'framer-motion';
import { Camera, Compass, Sparkles } from 'lucide-react';

interface WalkingCardProps {
  /** Whimsy prompt — the only thing on the card besides the verb. */
  whimsy: string;
  /** What kind of capture is being invited. */
  type?: 'photo' | 'voice' | 'observe';
  /** Optional landmark name for orientation (no logistics). */
  nearby?: string;
  onCapture?: () => void;
}

/**
 * Walking Card — interstitial Grand Quest prompt.
 *
 * Surfaces between attraction cards based on GPS / route.
 * Strictly whimsy + capture. No wait times, no LL, no rank.
 * Slim, gold-edged, parchment-warm.
 */
const WalkingCard = ({ whimsy, type = 'photo', nearby, onCapture }: WalkingCardProps) => {
  const Icon = type === 'photo' ? Camera : type === 'voice' ? Compass : Sparkles;
  const verb = type === 'photo' ? 'Capture' : type === 'voice' ? 'Record' : 'Note it';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-[88%] mx-auto px-5 py-4"
      style={{
        borderRadius: '16px',
        border: '1.5px dashed hsl(var(--gold) / 0.55)',
        background:
          'linear-gradient(180deg, hsl(var(--gold) / 0.06) 0%, hsl(var(--parchment)) 100%)',
        boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={10} style={{ color: 'hsl(var(--gold))' }} />
          <span
            className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
            style={{ color: 'hsl(var(--gold))' }}
          >
            On the walk
          </span>
        </div>
        {nearby && (
          <span
            className="font-sans text-[9px] italic truncate"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            near {nearby}
          </span>
        )}
      </div>

      <p
        className="font-display text-[16px] leading-snug text-foreground mb-3"
        style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
      >
        {whimsy}
      </p>

      <button
        onClick={onCapture}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign min-h-[40px]"
        style={{
          borderRadius: '16px',
          border: '1px solid hsl(var(--gold) / 0.4)',
          color: 'hsl(var(--gold))',
        }}
      >
        <Icon size={12} />
        {verb}
      </button>
    </motion.article>
  );
};

export default WalkingCard;
