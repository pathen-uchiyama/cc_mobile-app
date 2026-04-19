import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface Whisper {
  id: string;
  text: string;
  time: string;
}

const SAMPLE_WHISPERS: Whisper[] = [
  { id: '1', text: "The line for Pirates just dropped to 12 minutes.", time: '10:42' },
  { id: '2', text: "Pecos Bill's mobile order is ready in 18 minutes.", time: '10:38' },
  { id: '3', text: "Big Thunder swapped in. New wait: 15 minutes.", time: '10:30' },
  { id: '4', text: "Festival of Fantasy steps off in 12 minutes — front of Castle.", time: '10:24' },
  { id: '5', text: "Splash Mountain reopened. Want to add it back?", time: '10:18' },
];

const ROTATE_MS = 7000;

interface WhisperStripProps {
  /** When true, renders only the active whisper with no chrome (used in Minimalist Mode). */
  bare?: boolean;
}

/**
 * The Whisper Strip — single-line ticker, one whisper at a time.
 *
 * - Auto-rotates every 7s
 * - Swipe up on the strip → dismiss permanently
 * - Swipe down → expand to history (last 5)
 */
const WhisperStrip = ({ bare = false }: WhisperStripProps) => {
  const [whispers, setWhispers] = useState(SAMPLE_WHISPERS);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (whispers.length <= 1 || paused || expanded) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % whispers.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [whispers.length, paused, expanded]);

  const current = whispers[index];

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.changedTouches[0].clientY - startY.current;
    if (delta < -40) {
      // Swipe up — dismiss permanently
      const id = current?.id;
      if (id) {
        const next = whispers.filter((w) => w.id !== id);
        setWhispers(next);
        setIndex(0);
      }
    } else if (delta > 40) {
      // Swipe down — expand history
      setExpanded(true);
      setPaused(true);
    }
    startY.current = null;
  };

  if (!current) {
    if (bare) return null;
    return (
      <div className="w-full px-4">
        <div className="text-center py-2">
          <span className="font-sans text-[10px] text-muted-foreground/60 italic">All caught up.</span>
        </div>
      </div>
    );
  }

  if (bare) {
    return (
      <div className="text-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="font-display italic text-xl text-foreground leading-relaxed"
          >
            {current.text}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div
        className="relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Single-line ticker */}
        <div className="flex items-center px-4 py-2.5 gap-3 min-h-[40px]">
          <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          <div className="flex-1 min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={current.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="font-sans text-[11px] text-foreground truncate"
              >
                {current.text}
              </motion.p>
            </AnimatePresence>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="bg-transparent border-none cursor-pointer p-1 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Show whisper history"
          >
            <ChevronUp
              size={12}
              className={`text-muted-foreground transition-transform ${expanded ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        {/* History — expanded view */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/60"
            >
              <div className="px-4 py-2 space-y-1.5">
                {whispers.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-start gap-2 py-1">
                    <span className="font-sans text-[8px] text-muted-foreground tabular-nums shrink-0 mt-0.5">
                      {w.time}
                    </span>
                    <p className="font-sans text-[10px] text-foreground/80 leading-relaxed">
                      {w.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WhisperStrip;
