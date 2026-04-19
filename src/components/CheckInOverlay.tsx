import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import BottomSheet from './BottomSheet';

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
    <BottomSheet
      open={true}
      onClose={onClose}
      snap="full"
      eyebrow="Manual Sync — I'm Here"
      title={!synced ? 'Where are you right now?' : undefined}
      subtitle={!synced ? 'No GPS required. Tap your current landmark to sync your strategy.' : undefined}
    >
      {!synced ? (
        <>
          <div className="flex flex-col gap-2 mb-6">
            {LANDMARKS.map((l) => (
              <motion.button
                key={l.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(l.id)}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer bg-transparent text-left transition-colors ${
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
            className={`w-full py-3.5 rounded-xl font-sans text-[10px] uppercase tracking-sovereign font-bold border-none cursor-pointer transition-colors ${
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
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Check size={20} className="text-accent" />
          </div>
          <span className="font-display text-lg text-foreground">Position Synced</span>
          <span className="font-sans text-[10px] text-muted-foreground mt-1">
            Strategy updated accordingly
          </span>
        </motion.div>
      )}
    </BottomSheet>
  );
};

export default CheckInOverlay;
