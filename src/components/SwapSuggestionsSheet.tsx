import { motion } from 'framer-motion';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';

interface SwapOption {
  id: string;
  ride: string;
  area: string;
  wait: string;
  reason: string;
}

const OPTIONS: SwapOption[] = [
  { id: '1', ride: 'Big Thunder Mountain', area: 'Frontierland', wait: '8 min', reason: 'Walk-on window opening — won\'t last' },
  { id: '2', ride: 'Jungle Cruise', area: 'Adventureland', wait: '14 min', reason: 'On your route, low queue' },
  { id: '3', ride: 'Tiki Room (refresh)', area: 'Adventureland', wait: '2 min', reason: 'Air conditioned · 12 min show' },
];

interface SwapSuggestionsSheetProps {
  open: boolean;
  onClose: () => void;
  /** The ride the user just swiped away from. */
  skipped?: string;
}

const SwapSuggestionsSheet = ({ open, onClose, skipped }: SwapSuggestionsSheetProps) => {
  const { celebrate } = useCelebrate();

  const pick = (opt: SwapOption) => {
    onClose();
    const tip = WHISPERS.swap[Math.floor(Math.random() * WHISPERS.swap.length)];
    setTimeout(() => celebrate(tip, 'Path Rerouted'), 200);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snap="half"
      eyebrow="✨ AI Swap Suggestions"
      title={skipped ? `Skipping ${skipped}?` : 'Pivot the plan'}
      subtitle="Three nearby alternatives, ranked by signal."
    >
      <div className="space-y-2.5">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => pick(opt)}
            className="w-full text-left bg-card hover:bg-accent/5 border border-border hover:border-accent/40 rounded-xl p-4 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-foreground truncate">{opt.ride}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">{opt.area}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-accent/15 px-2.5 py-1 rounded-full shrink-0">
                <Clock size={10} className="text-accent" />
                <span className="font-sans text-xs text-accent font-bold tabular-nums">{opt.wait}</span>
              </div>
            </div>
            <p className="font-sans text-[10px] text-muted-foreground italic flex items-center gap-1.5">
              <Sparkles size={9} className="text-accent shrink-0" />
              {opt.reason}
            </p>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-5 py-3 bg-transparent border-none cursor-pointer"
      >
        <span className="font-sans text-[10px] text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30">
          Keep original plan
        </span>
      </button>
    </BottomSheet>
  );
};

export default SwapSuggestionsSheet;
