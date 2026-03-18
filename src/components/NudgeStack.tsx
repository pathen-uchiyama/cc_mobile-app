import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Utensils, RefreshCw, X, Bell } from 'lucide-react';

interface Nudge {
  id: string;
  type: 'info' | 'action' | 'update';
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  actionLabel?: string;
  tier: 'free' | 'paid';
}

const SAMPLE_NUDGES: Nudge[] = [
  {
    id: '1',
    type: 'action',
    icon: Utensils,
    title: 'Lunch window approaching',
    body: "Your party's little ones will be hungry around 11:30. Mobile order at Pecos Bill's now — food ready in 18 min.",
    actionLabel: 'Place Order Now',
    tier: 'paid',
  },
  {
    id: '2',
    type: 'info',
    icon: AlertTriangle,
    title: 'Splash Mountain temporarily closed',
    body: "We're monitoring the reopening. No action needed yet.",
    tier: 'free',
  },
  {
    id: '3',
    type: 'update',
    icon: RefreshCw,
    title: 'Itinerary updated',
    body: 'Big Thunder Mountain was swapped in while Space Mountain is down. Your new wait: 15 min.',
    tier: 'paid',
  },
];

const AUTO_DISMISS_MS = 5000;
const STAGGER_DELAY_MS = 1200;

const NudgeStack = () => {
  const [allNudges] = useState(SAMPLE_NUDGES);
  const [visibleToast, setVisibleToast] = useState<Nudge | null>(null);
  const [actionQueue, setActionQueue] = useState<Nudge[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const [showActionTray, setShowActionTray] = useState(false);

  // Drip-feed nudges as toasts one at a time
  useEffect(() => {
    const unshown = allNudges.filter(n => !shownIds.has(n.id));
    if (unshown.length === 0 || visibleToast) return;

    const next = unshown[0];
    const timer = setTimeout(() => {
      setVisibleToast(next);
      setShownIds(prev => new Set(prev).add(next.id));

      // If it has an action, queue it; otherwise auto-dismiss
      if (next.actionLabel) {
        setActionQueue(prev => [...prev, next]);
      }
    }, shownIds.size === 0 ? 800 : STAGGER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [allNudges, shownIds, visibleToast]);

  // Auto-dismiss non-action toasts
  useEffect(() => {
    if (!visibleToast) return;
    const timer = setTimeout(() => {
      setVisibleToast(null);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visibleToast]);

  const dismissToast = useCallback(() => {
    setVisibleToast(null);
  }, []);

  const dismissAction = useCallback((id: string) => {
    setActionQueue(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <>
      {/* Floating toast — appears at top, auto-dismisses */}
      <div className="fixed top-[68px] inset-x-0 max-w-[480px] mx-auto z-[60] px-4 pointer-events-none">
        <AnimatePresence>
          {visibleToast && (
            <motion.div
              key={visibleToast.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto"
            >
              <div className={`bg-card p-4 shadow-boutique border-l-4 relative ${
                visibleToast.type === 'action'
                  ? 'border-l-accent'
                  : visibleToast.type === 'update'
                  ? 'border-l-primary'
                  : 'border-l-muted-foreground'
              }`}>
                <button
                  onClick={dismissToast}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X size={12} className="text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <visibleToast.icon
                    size={14}
                    className={`mt-0.5 shrink-0 ${
                      visibleToast.type === 'action' ? 'text-accent' : 'text-muted-foreground'
                    }`}
                  />
                  <div>
                    <h3 className="font-sans text-xs font-semibold text-foreground mb-0.5">
                      {visibleToast.title}
                    </h3>
                    <p className="font-sans text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {visibleToast.body}
                    </p>
                  </div>
                </div>

                {/* Auto-dismiss progress bar */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent/40 origin-left"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent action badge — only shows when there are queued actions */}
      <AnimatePresence>
        {actionQueue.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-[68px] right-4 max-w-[480px] z-[55]"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActionTray(!showActionTray)}
              className="relative w-10 h-10 bg-accent flex items-center justify-center shadow-boutique border-none cursor-pointer"
            >
              <Bell size={16} className="text-accent-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                {actionQueue.length}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action tray — slides out from badge */}
      <AnimatePresence>
        {showActionTray && actionQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[116px] right-4 z-[55] w-[280px]"
          >
            <div className="bg-card shadow-boutique-hover p-1">
              <div className="px-3 py-2 border-b border-border">
                <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
                  ★ Actions Needed
                </span>
              </div>
              {actionQueue.map((nudge) => {
                const Icon = nudge.icon;
                return (
                  <div key={nudge.id} className="p-3 border-b border-border last:border-b-0">
                    <div className="flex items-start gap-2 mb-2">
                      <Icon size={12} className="text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-sans text-[11px] font-semibold text-foreground">{nudge.title}</p>
                        <p className="font-sans text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{nudge.body}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pl-5">
                      <button className="px-3 py-1.5 bg-primary text-primary-foreground font-sans text-[9px] uppercase tracking-sovereign border-none cursor-pointer min-h-[32px]">
                        {nudge.actionLabel}
                      </button>
                      <button
                        onClick={() => dismissAction(nudge.id)}
                        className="px-3 py-1.5 bg-transparent text-muted-foreground font-sans text-[9px] uppercase tracking-sovereign border border-border cursor-pointer min-h-[32px]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NudgeStack;
