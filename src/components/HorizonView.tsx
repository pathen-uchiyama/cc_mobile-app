import { motion } from 'framer-motion';
import { Sun, Clock, TrendingUp } from 'lucide-react';

const HorizonView = ({ onOpenPulse }: { onOpenPulse: () => void }) => {
  return (
    <div className="px-6 pt-4 pb-32">
      <h2 className="font-display text-2xl text-foreground mb-1">The Horizon</h2>
      <p className="font-sans text-xs text-muted-foreground mb-8 uppercase tracking-sovereign">What demands your attention now.</p>

      {/* Time & Weather */}
      <div className="bg-card p-6 shadow-boutique mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-sans tabular-nums text-4xl font-light text-foreground">14:23</span>
            <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mt-1">Park closes at 22:00</p>
          </div>
          <div className="text-right flex items-center gap-3">
            <Sun size={20} className="text-gold" />
            <div>
              <span className="font-sans tabular-nums text-lg text-foreground">84°F</span>
              <p className="font-sans text-[10px] text-muted-foreground">Partly Cloudy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Up */}
      <div className="bg-card p-6 shadow-boutique mb-4 border-l-4 border-gold">
        <span className="font-sans text-[10px] uppercase tracking-sovereign text-gold block mb-2">Next Up</span>
        <h3 className="font-display text-xl text-foreground mb-1">Haunted Mansion</h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span className="font-sans tabular-nums text-xs text-muted-foreground">In 37 minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-gold" />
            <span className="font-sans tabular-nums text-xs text-gold font-medium">Wait dropping</span>
          </div>
        </div>
      </div>

      {/* Concierge Insight */}
      <div className="bg-card p-6 shadow-boutique mb-4">
        <span className="font-sans text-[10px] uppercase tracking-sovereign text-thistle block mb-2">Concierge Insight</span>
        <p className="font-display italic text-foreground text-sm leading-relaxed">
          "The afternoon parade begins in 45 minutes. Tomorrowland will empty — ideal for Tron Lightcycle Run."
        </p>
      </div>

      {/* Pulse CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onOpenPulse}
        className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left"
      >
        <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground block mb-2">Daily Check-in</span>
        <h3 className="font-display text-lg text-foreground">How does the heart feel?</h3>
        <p className="font-sans text-xs text-muted-foreground mt-1">Tap to log your 14:00 pulse</p>
      </motion.button>
    </div>
  );
};

export default HorizonView;
