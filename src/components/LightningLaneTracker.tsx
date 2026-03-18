import { motion } from 'framer-motion';
import { Zap, Clock, Sparkles } from 'lucide-react';

interface LLReservation {
  id: string;
  ride: string;
  window: string;
  type: 'll' | 'ill';
}

const RESERVATIONS: LLReservation[] = [
  { id: '1', ride: 'Haunted Mansion', window: '11:00–12:00', type: 'll' },
  { id: '2', ride: 'Jungle Cruise', window: '1:15–2:15', type: 'll' },
  { id: '3', ride: 'Big Thunder', window: '2:45–3:45', type: 'll' },
];

const ILL_RESERVATIONS: LLReservation[] = [
  { id: 'ill1', ride: 'Tron', window: '12:30–1:30', type: 'ill' },
  { id: 'ill2', ride: 'Guardians', window: '3:00–4:00', type: 'ill' },
];

interface LightningLaneTrackerProps {
  visible: boolean;
}

const LightningLaneTracker = ({ visible }: LightningLaneTrackerProps) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 shrink-0"
    >
      <div className="bg-card rounded-xl shadow-boutique p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-accent" />
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">
              Lightning Lane
            </span>
          </div>
          <span className="font-sans text-[9px] text-muted-foreground tabular-nums">
            {RESERVATIONS.length} LL · {ILL_RESERVATIONS.length} ILL
          </span>
        </div>

        {/* LL Reservations — 3 columns */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {RESERVATIONS.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-accent/8 border border-accent/15 rounded-lg p-2.5 text-center"
            >
              <Zap size={10} className="text-accent mx-auto mb-1" />
              <p className="font-sans text-[10px] font-semibold text-foreground leading-tight truncate">
                {res.ride}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock size={8} className="text-muted-foreground" />
                <span className="font-sans text-[8px] text-muted-foreground tabular-nums">
                  {res.window}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ILL Reservations — up to 2, compact row */}
        {ILL_RESERVATIONS.length > 0 && (
          <div className="flex gap-2 mb-3">
            {ILL_RESERVATIONS.slice(0, 2).map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex-1 bg-primary/8 border border-primary/15 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <div className="w-5 h-5 bg-primary/15 rounded-md flex items-center justify-center shrink-0">
                  <Zap size={9} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-[10px] font-semibold text-foreground truncate">
                    {res.ride}
                  </p>
                  <span className="font-sans text-[8px] text-muted-foreground tabular-nums">
                    {res.window}
                  </span>
                </div>
                <span className="font-sans text-[7px] uppercase tracking-sovereign text-primary font-bold shrink-0">
                  ILL
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* LL Manager CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full py-2.5 bg-primary text-primary-foreground font-sans text-[9px] uppercase tracking-sovereign font-bold border-none cursor-pointer rounded-lg flex items-center justify-center gap-1.5"
        >
          <Sparkles size={10} />
          LL Manager
          <span className="text-accent text-[8px] ml-1">✨ AI</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LightningLaneTracker;
