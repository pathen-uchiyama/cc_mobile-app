import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Utensils, RefreshCw, X } from 'lucide-react';

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
    body: 'Your party\'s little ones will be hungry around 11:30. Mobile order at Pecos Bill\'s now — food ready in 18 min.',
    actionLabel: 'Place Order Now',
    tier: 'paid',
  },
  {
    id: '2',
    type: 'info',
    icon: AlertTriangle,
    title: 'Splash Mountain temporarily closed',
    body: 'We\'re monitoring the reopening. No action needed yet.',
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

const NudgeStack = () => {
  const [nudges, setNudges] = useState(SAMPLE_NUDGES);

  const dismiss = (id: string) => {
    setNudges(prev => prev.filter(n => n.id !== id));
  };

  if (nudges.length === 0) return null;

  return (
    <div className="px-6 pt-4 space-y-3">
      <AnimatePresence mode="popLayout">
        {nudges.map((nudge) => {
          const Icon = nudge.icon;
          const borderColor = nudge.type === 'action'
            ? 'border-l-accent'
            : nudge.type === 'update'
            ? 'border-l-primary'
            : 'border-l-muted-foreground';

          return (
            <motion.div
              key={nudge.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`bg-card p-4 shadow-boutique border-l-4 ${borderColor} relative`}
            >
              <button
                onClick={() => dismiss(nudge.id)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={14} className="text-muted-foreground" />
              </button>

              <div className="flex items-start gap-3 pr-8">
                <Icon size={16} className={`mt-0.5 shrink-0 ${nudge.type === 'action' ? 'text-accent' : 'text-muted-foreground'}`} />
                <div>
                  <h3 className="font-sans text-xs font-semibold text-foreground mb-1">{nudge.title}</h3>
                  <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">{nudge.body}</p>
                  {nudge.actionLabel && (
                    <button className="mt-3 px-4 py-2.5 bg-primary text-primary-foreground font-sans text-[10px] uppercase tracking-sovereign border-none cursor-pointer min-h-[44px]">
                      {nudge.actionLabel}
                    </button>
                  )}
                  {nudge.tier === 'paid' && (
                    <span className="inline-block mt-2 font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
                      ★ Concierge
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NudgeStack;
