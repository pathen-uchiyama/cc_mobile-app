import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCompanion } from './CompanionContext';

interface Celebration {
  id: number;
  /** Witty Library of Whispers tip — the sentence shown to the user. */
  tip: string;
  /** Optional accent (e.g. "LL Sniped" / "You've Arrived"). */
  eyebrow?: string;
}

interface CelebrationContextValue {
  celebrate: (tip: string, eyebrow?: string) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
};

export const CelebrationProvider = ({ children }: { children: ReactNode }) => {
  const { celebrationsEnabled, hapticsEnabled } = useCompanion();
  const [active, setActive] = useState<Celebration | null>(null);

  const celebrate = useCallback((tip: string, eyebrow?: string) => {
    if (!celebrationsEnabled) return;
    if (hapticsEnabled) triggerHaptic([12, 30, 12, 30, 30]);
    setActive({ id: Date.now(), tip, eyebrow });
  }, [celebrationsEnabled, hapticsEnabled]);

  // Auto-dismiss after 3.2s
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), 3200);
    return () => clearTimeout(t);
  }, [active]);

  // Generate a few sparkle positions
  const sparkles = Array.from({ length: 8 });

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}

      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center px-6"
            onClick={() => setActive(null)}
          >
            {/* Soft gold halo */}
            <motion.div
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.3) 0%, transparent 70%)' }}
            />

            {/* Sparkle particles */}
            {sparkles.map((_, i) => {
              const angle = (i / sparkles.length) * Math.PI * 2;
              const distance = 80 + Math.random() * 60;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x, y, opacity: [0, 1, 0], scale: [0, 1, 0] }}
                  transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
                  className="absolute"
                >
                  <Sparkles size={14} className="text-accent" />
                </motion.div>
              );
            })}

            {/* The Whisper */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -8 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="relative bg-card/95 backdrop-blur-md shadow-boutique-hover rounded-2xl px-6 py-5 max-w-[320px] text-center pointer-events-auto"
            >
              {active.eyebrow && (
                <p className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold mb-2 flex items-center justify-center gap-1.5">
                  <Sparkles size={10} />
                  {active.eyebrow}
                </p>
              )}
              <p className="font-display italic text-lg text-foreground leading-relaxed">
                "{active.tip}"
              </p>
              <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground mt-3">
                Library of Whispers
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
};

export const useCelebrate = () => {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebrate must be used within CelebrationProvider');
  return ctx;
};

/** Random witty tips — the Library of Whispers. */
export const WHISPERS = {
  llSnipe: [
    "We just whispered to the queue and it whispered back. Space Mountain is yours.",
    "A Lightning Lane just blinked into existence. We caught it mid-blink.",
    "The wait melted. Walk slowly — savor the small victory.",
  ],
  arrival: [
    "You've arrived. The mountain remembers everyone who climbs it.",
    "The path is clear; the gate is open. Step through.",
    "Right on time. The castle approves.",
  ],
  swap: [
    "We rerouted. Nobody will know but us.",
    "Better wind, better wait. Your day just got 18 minutes lighter.",
  ],
} as const;
