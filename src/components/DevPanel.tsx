import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Zap, Sparkles, MapPin, X } from 'lucide-react';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';
import { useJoyEvents } from '@/contexts/JoyEventsContext';

/**
 * Dev panel — toggleable from Settings. Lets us pressure-test
 * celebration timing, copy variety, and event logging without
 * walking through the full UX every time.
 */
const DevPanel = () => {
  const { celebrate } = useCelebrate();
  const { log, events, clear } = useJoyEvents();
  const [open, setOpen] = useState(false);

  const fireSnipe = () => {
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Sniped');
    log({ type: 'snipe', title: 'Test · LL Sniped', quote: tip, savedMinutes: 25 });
  };

  const fireArrival = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, "You've Arrived");
    log({ type: 'arrival', title: 'Test · Arrival', quote: tip });
  };

  const fireSwap = () => {
    const tip = WHISPERS.swap[Math.floor(Math.random() * WHISPERS.swap.length)];
    celebrate(tip, 'Path Rerouted');
    log({ type: 'swap', title: 'Test · Swap accepted', quote: tip, savedMinutes: 18 });
  };

  return (
    <>
      {/* Toggle FAB — bottom-left so it doesn't clash with the Sovereign Key */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-4 z-[9988] w-10 h-10 rounded-full bg-card shadow-boutique border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
        aria-label="Toggle dev panel"
      >
        {open ? <X size={14} className="text-foreground" /> : <FlaskConical size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -16, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 left-4 z-[9988] w-[260px] bg-card rounded-2xl shadow-boutique-hover p-4 border border-border"
          >
            <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-bold mb-3">
              Dev · Snipe Simulator
            </p>

            <div className="space-y-1.5">
              <button
                onClick={fireSnipe}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg cursor-pointer text-left transition-colors"
              >
                <Zap size={12} className="text-accent" />
                <span className="font-sans text-[11px] text-foreground">Fire LL Snipe</span>
              </button>
              <button
                onClick={fireArrival}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/60 hover:bg-muted border border-border rounded-lg cursor-pointer text-left transition-colors"
              >
                <MapPin size={12} className="text-foreground" />
                <span className="font-sans text-[11px] text-foreground">Fire Arrival</span>
              </button>
              <button
                onClick={fireSwap}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/60 hover:bg-muted border border-border rounded-lg cursor-pointer text-left transition-colors"
              >
                <Sparkles size={12} className="text-foreground" />
                <span className="font-sans text-[11px] text-foreground">Fire Swap</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="font-sans text-[9px] text-muted-foreground tabular-nums">
                {events.length} events logged
              </span>
              <button
                onClick={clear}
                className="font-sans text-[9px] text-destructive underline underline-offset-2 bg-transparent border-none cursor-pointer"
              >
                Clear log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DevPanel;
