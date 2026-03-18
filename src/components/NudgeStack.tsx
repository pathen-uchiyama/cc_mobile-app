import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Utensils, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Nudge {
  id: string;
  type: 'info' | 'action' | 'update';
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  actionLabel?: string;
  time: string;
  read: boolean;
}

const SAMPLE_NUDGES: Nudge[] = [
  {
    id: '1',
    type: 'action',
    icon: Utensils,
    title: 'Lunch window approaching',
    body: "Mobile order at Pecos Bill's — food ready in 18 min.",
    actionLabel: 'Order Now',
    time: '10:42 AM',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    icon: AlertTriangle,
    title: 'Splash Mountain closed',
    body: "Monitoring reopening. No action needed.",
    time: '10:38 AM',
    read: false,
  },
  {
    id: '3',
    type: 'update',
    icon: RefreshCw,
    title: 'Route optimized',
    body: 'Big Thunder swapped in. New wait: 15 min.',
    time: '10:30 AM',
    read: true,
  },
];

const AUTO_ROTATE_MS = 6000;

const NudgeStack = () => {
  const [nudges, setNudges] = useState(SAMPLE_NUDGES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  // Auto-rotate, stoppable
  useEffect(() => {
    if (nudges.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex(prev => (prev + 1) % nudges.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [nudges.length, paused]);

  const goTo = (dir: -1 | 1) => {
    setDirection(dir);
    setActiveIndex(prev => (prev + dir + nudges.length) % nudges.length);
  };

  const dismissCurrent = () => {
    if (nudges.length <= 1) {
      setNudges([]);
      return;
    }
    const id = nudges[activeIndex].id;
    const next = nudges.filter(n => n.id !== id);
    setNudges(next);
    setActiveIndex(prev => prev >= next.length ? 0 : prev);
  };

  const markRead = (id: string) => {
    setNudges(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const current = nudges[activeIndex];
  const unreadCount = nudges.filter(n => !n.read).length;

  return (
    <div className="w-full px-4">
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        {/* Ticker header */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${unreadCount > 0 ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
            <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              Concierge
            </span>
            {unreadCount > 0 && (
              <span className="font-sans text-[8px] text-accent font-bold tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nudges.length > 1 && (
              <div className="flex items-center gap-1">
                {nudges.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full transition-colors ${
                      i === activeIndex ? 'bg-foreground' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            )}
            {current && (
              <button
                onClick={dismissCurrent}
                className="w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer opacity-40 hover:opacity-80 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X size={10} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Current nudge */}
        {current ? (
          <div className="relative px-4 pb-3 min-h-[52px]">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-start gap-3"
                onClick={() => { markRead(current.id); setPaused(true); }}
              >
                <current.icon
                  size={13}
                  className={`mt-0.5 shrink-0 ${
                    current.type === 'action' ? 'text-accent'
                    : current.type === 'update' ? 'text-primary'
                    : 'text-muted-foreground'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-sans text-[11px] font-semibold text-foreground truncate ${
                      current.read ? 'opacity-60' : ''
                    }`}>
                      {current.title}
                    </h3>
                    <span className="font-sans text-[8px] text-muted-foreground tabular-nums shrink-0">
                      {current.time}
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                    {current.body}
                  </p>
                  {current.actionLabel && (
                    <button className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground font-sans text-[9px] uppercase tracking-sovereign border-none cursor-pointer rounded-md">
                      {current.actionLabel}
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {nudges.length > 1 && (
              <>
                <button
                  onClick={() => goTo(-1)}
                  className="absolute left-0.5 top-1/2 -translate-y-1/2 w-6 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer opacity-30 hover:opacity-60 transition-opacity"
                  aria-label="Previous"
                >
                  <ChevronLeft size={10} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => goTo(1)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 w-6 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer opacity-30 hover:opacity-60 transition-opacity"
                  aria-label="Next"
                >
                  <ChevronRight size={10} className="text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="px-4 pb-3">
            <p className="font-sans text-[10px] text-muted-foreground italic">No notifications right now</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NudgeStack;
