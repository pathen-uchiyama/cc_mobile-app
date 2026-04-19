import { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';

interface DirectionalNowCardProps {
  time: string;
  title: string;
  location: string;
  /** Direction noun for the verb ("Adventureland") */
  destination: string;
  wait?: string;
  onSkip?: () => void;
  onCommit?: () => void;
}

/**
 * The Right Now card, reframed from noun → verb.
 *
 * - Headline is a directional verb ("Drift toward Adventureland →")
 * - Wait time is a live pill in upper-right
 * - Swipe left → skip / suggest alternative
 * - Swipe right → "I'm on my way" (commit)
 */
const DirectionalNowCard = ({
  time, title, location, destination, wait, onSkip, onCommit,
}: DirectionalNowCardProps) => {
  const [exited, setExited] = useState<'left' | 'right' | null>(null);
  const dragX = useRef(0);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -120 || velocity < -500) {
      setExited('left');
      onSkip?.();
    } else if (offset > 120 || velocity > 500) {
      setExited('right');
      onCommit?.();
    }
    dragX.current = 0;
  };

  return (
    <div className="relative">
      {/* Swipe affordance — left (skip) */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center pl-4 pointer-events-none">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground/40 font-semibold">
          Skip
        </span>
      </div>
      {/* Swipe affordance — right (commit) */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 pointer-events-none">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent/60 font-semibold">
          On my way
        </span>
      </div>

      <AnimatePresence>
        {!exited && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              x: exited === 'left' ? -400 : 400,
              transition: { duration: 0.25 },
            }}
            className="bg-card p-5 shadow-boutique rounded-xl relative cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {/* Wait time — upper right pill */}
            {wait && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-accent/15 px-3 py-1.5 rounded-full">
                <Clock size={12} className="text-accent" />
                <span className="font-sans text-sm text-accent font-bold tabular-nums">
                  {wait}
                </span>
              </div>
            )}

            {/* Eyebrow — live pulse */}
            <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold flex items-center gap-1.5 mb-3">
              <motion.div
                className="w-2 h-2 bg-accent rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              Right Now · {time}
            </span>

            {/* Verb-led headline with breathing arrow */}
            <h3 className="font-display text-xl text-foreground leading-snug flex items-baseline gap-2 flex-wrap">
              <span>Drift toward {destination}</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                className="text-accent inline-block"
              >
                →
              </motion.span>
            </h3>

            {/* Sub — the actual ride / activity */}
            <p className="font-sans text-[12px] text-foreground/80 mt-1.5 italic">
              {title}
            </p>

            <div className="flex items-center gap-1 mt-3">
              <MapPin size={10} className="text-muted-foreground" />
              <span className="font-sans text-[10px] text-muted-foreground">{location}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DirectionalNowCard;
