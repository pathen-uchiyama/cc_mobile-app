import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import BottomSheet from './BottomSheet';

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
    <BottomSheet
      open={true}
      onClose={onClose}
      snap="full"
      eyebrow={!done ? 'Pivot Strategy — Recalibrate' : undefined}
      title={!done ? 'What changed?' : undefined}
      subtitle={!done ? "Tell us what happened and we'll recalculate your optimal path." : undefined}
    >
      {done ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center py-8"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles size={20} className="text-accent" />
          </div>
          <span className="font-display text-lg text-foreground">Path Recalculated</span>
          <span className="font-sans text-[10px] text-muted-foreground mt-1">
            ✨ AI — Your timeline has been optimized
          </span>
        </motion.div>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-6">
            {REASONS.map((r) => {
              const Icon = r.icon;
              return (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(r.id)}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer bg-transparent text-left transition-colors ${
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
            className={`w-full py-3.5 rounded-xl font-sans text-[10px] uppercase tracking-sovereign font-bold border-none cursor-pointer transition-colors flex items-center justify-center gap-2 ${
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
    </BottomSheet>
  );
};

export default RecalibrateSheet;
