import { motion } from 'framer-motion';
import { RefreshCw, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface RecalibrateSheetProps {
  onClose: () => void;
}

const REASONS = [
  { id: 'closure', label: 'Ride Closure', icon: AlertTriangle, desc: 'An attraction just closed unexpectedly' },
  { id: 'delay', label: 'Running Behind', icon: RefreshCw, desc: 'We fell behind schedule' },
  { id: 'mood', label: 'Need a Break', icon: Sparkles, desc: 'Energy low — find a calm zone' },
];

const RecalibrateSheet = ({ onClose }: RecalibrateSheetProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [recalibrating, setRecalibrating] = useState(false);
  const [done, setDone] = useState(false);

  const handleRecalibrate = () => {
    if (!selected) return;
    setRecalibrating(true);
    setTimeout(() => {
      setRecalibrating(false);
      setDone(true);
      setTimeout(onClose, 1500);
    }, 2000);
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
        {done ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-12 h-12 bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-accent" />
            </div>
            <span className="font-display text-lg text-foreground">Path Recalculated</span>
            <span className="font-sans text-[10px] text-muted-foreground mt-1">
              ✨ AI — Your timeline has been optimized
            </span>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <RefreshCw size={14} className="text-accent" />
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">
                Pivot Strategy — Recalibrate
              </span>
            </div>

            <h2 className="font-display text-xl text-foreground mb-1">
              What changed?
            </h2>
            <p className="font-sans text-[11px] text-muted-foreground mb-5">
              Tell us what happened and we'll recalculate your optimal path.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {REASONS.map((r) => {
                const Icon = r.icon;
                return (
                  <motion.button
                    key={r.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(r.id)}
                    className={`flex items-center gap-4 p-4 border cursor-pointer bg-transparent text-left transition-colors ${
                      selected === r.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <Icon size={16} className={selected === r.id ? 'text-accent' : 'text-muted-foreground'} />
                    <div>
                      <span className="font-display text-sm text-foreground block">{r.label}</span>
                      <span className="font-sans text-[10px] text-muted-foreground">{r.desc}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRecalibrate}
              disabled={!selected || recalibrating}
              className={`w-full py-3.5 font-sans text-[10px] uppercase tracking-sovereign font-bold border-none cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                selected && !recalibrating
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {recalibrating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Recalculating…
                </>
              ) : (
                <>
                  Recalculate Path <span className="text-accent">✨ AI</span>
                </>
              )}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RecalibrateSheet;
