import { motion } from 'framer-motion';
import { Zap, Clock, Sparkles } from 'lucide-react';

interface LLReservation {
  id: string;
  ride: string;
  window: string;
  type: 'll' | 'ill';
}

const RESERVATIONS: LLReservation[] = [
  { id: '1', ride: 'Haunted Mansion', window: '11–12', type: 'll' },
  { id: '2', ride: 'Jungle Cruise', window: '1:15–2:15', type: 'll' },
  { id: '3', ride: 'Big Thunder', window: '2:45–3:45', type: 'll' },
];

const ILL_RESERVATIONS: LLReservation[] = [
  { id: 'ill1', ride: 'Tron', window: '12:30', type: 'ill' },
  { id: 'ill2', ride: 'Guardians', window: '3:00', type: 'ill' },
];

type Tier = 'standard' | 'manager' | 'autonomous';

interface LightningLaneTrackerProps {
  visible: boolean;
  tier?: Tier;
}

const LightningLaneTracker = ({ visible, tier = 'manager' }: LightningLaneTrackerProps) => {
  if (!visible) return null;

  const showManagerCTA = tier === 'manager';

  return (
    <div className="bg-card/60 rounded-xl border border-border/60 px-3 py-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap size={10} className="text-accent" />
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
            Lightning Lane
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {ILL_RESERVATIONS.slice(0, 2).map((res) => (
            <span key={res.id} className="font-sans text-[7px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-sovereign">
              ILL {res.ride} · {res.window}
            </span>
          ))}
        </div>
      </div>

      {/* LL slots — 3 compact columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {RESERVATIONS.map((res) => (
          <div
            key={res.id}
            className="bg-accent/6 border border-accent/10 rounded-lg px-2 py-1.5 text-center"
          >
            <p className="font-sans text-[9px] font-semibold text-foreground truncate leading-tight">
              {res.ride}
            </p>
            <span className="font-sans text-[7px] text-muted-foreground tabular-nums">
              {res.window}
            </span>
          </div>
        ))}
      </div>

      {/* Manager CTA — only for manager tier */}
      {showManagerCTA && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full mt-2 py-1.5 bg-primary/10 text-primary font-sans text-[8px] uppercase tracking-sovereign font-bold border-none cursor-pointer rounded-lg flex items-center justify-center gap-1"
        >
          <Sparkles size={8} />
          LL Manager
          <span className="text-accent">✨</span>
        </motion.button>
      )}
    </div>
  );
};

export default LightningLaneTracker;
