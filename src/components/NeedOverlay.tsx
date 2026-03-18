import { motion } from 'framer-motion';
import { X, MapPin, Clock } from 'lucide-react';

interface NeedOverlayProps {
  type: 'bathroom' | 'quiet';
  onClose: () => void;
}

const BATHROOMS = [
  { name: 'Adventureland Restrooms', distance: '2 min walk', crowd: 'Low' },
  { name: 'Fantasyland Restrooms (near Storybook)', distance: '4 min walk', crowd: 'Moderate' },
  { name: 'Tomorrowland Restrooms', distance: '6 min walk', crowd: 'Low' },
];

const QUIET_SPACES = [
  { name: 'Tom Sawyer Island', distance: '5 min walk', note: 'Shaded benches, minimal foot traffic' },
  { name: 'Columbia Harbour House (upstairs)', distance: '3 min walk', note: 'Air conditioned, rarely crowded' },
  { name: 'The Tomorrowland Transit Authority', distance: '4 min walk', note: 'Sit down, gentle breeze, low stimulation' },
];

const NeedOverlay = ({ type, onClose }: NeedOverlayProps) => {
  const items = type === 'bathroom' ? BATHROOMS : QUIET_SPACES;
  const title = type === 'bathroom' ? 'Nearest Restrooms' : 'Quiet Spaces Nearby';
  const subtitle = type === 'bathroom'
    ? 'Sorted by proximity to your current location'
    : 'Low-stimulation zones for when you need a reset';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990]"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-foreground/40"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 200 }}
        className="absolute bottom-0 inset-x-0 bg-background max-w-[480px] mx-auto p-6 pb-12"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-foreground">{title}</h2>
            <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="Close"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card p-5 shadow-boutique"
            >
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">{item.name}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">{item.distance}</span>
                </div>
                {'crowd' in item && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="font-sans text-[10px] text-muted-foreground">Crowd: <span className="text-foreground font-semibold">{item.crowd}</span></span>
                  </div>
                )}
                {'note' in item && (
                  <span className="font-sans text-[10px] text-muted-foreground italic">{item.note}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NeedOverlay;
