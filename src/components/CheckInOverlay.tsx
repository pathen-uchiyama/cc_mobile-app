import { motion } from 'framer-motion';
import { MapPin, Check } from 'lucide-react';
import { useState } from 'react';

const LANDMARKS = [
  { id: 'adv', name: 'Adventureland', sub: 'Near Pirates entrance' },
  { id: 'lib', name: 'Liberty Square', sub: 'Haunted Mansion plaza' },
  { id: 'fan', name: 'Fantasyland', sub: 'Castle courtyard' },
  { id: 'tom', name: 'Tomorrowland', sub: 'Space Mountain queue' },
  { id: 'main', name: 'Main Street U.S.A.', sub: 'Town Square' },
];

interface CheckInOverlayProps {
  onClose: () => void;
}

const CheckInOverlay = ({ onClose }: CheckInOverlayProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    if (!selected) return;
    setSynced(true);
    setTimeout(onClose, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/60 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-[480px] p-6 pb-10 shadow-boutique"
      >
        {!synced ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <MapPin size={14} className="text-accent" />
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">
                Manual Sync — I'm Here
              </span>
            </div>

            <h2 className="font-display text-xl text-foreground mb-1">
              Where are you right now?
            </h2>
            <p className="font-sans text-[11px] text-muted-foreground mb-5">
              No GPS required. Tap your current landmark to sync your strategy.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {LANDMARKS.map((l) => (
                <motion.button
                  key={l.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(l.id)}
                  className={`flex items-center justify-between p-4 border cursor-pointer bg-transparent text-left transition-colors ${
                    selected === l.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div>
                    <span className="font-display text-sm text-foreground block">{l.name}</span>
                    <span className="font-sans text-[10px] text-muted-foreground">{l.sub}</span>
                  </div>
                  {selected === l.id && <Check size={14} className="text-accent" />}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSync}
              disabled={!selected}
              className={`w-full py-3.5 font-sans text-[10px] uppercase tracking-sovereign font-bold border-none cursor-pointer transition-colors ${
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Sync Position
            </motion.button>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-12 h-12 bg-accent/10 flex items-center justify-center mb-4">
              <Check size={20} className="text-accent" />
            </div>
            <span className="font-display text-lg text-foreground">Position Synced</span>
            <span className="font-sans text-[10px] text-muted-foreground mt-1">
              Strategy updated accordingly
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CheckInOverlay;
