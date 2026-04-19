import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Check } from 'lucide-react';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';
import type { ServiceTier } from '@/contexts/CompanionContext';

interface LLReservation {
  id: string;
  ride: string;
  window: string;
  /** "ll" or "ill" */
  type: 'll' | 'ill';
  /** Has the return window already opened? */
  active?: boolean;
  /** Has it been used / redeemed? */
  used?: boolean;
}

const RESERVATIONS: LLReservation[] = [
  { id: '1', ride: 'Pirates', window: '10:15', type: 'll', used: true },
  { id: '2', ride: 'Haunted Mansion', window: '11:00', type: 'll', active: true },
  { id: '3', ride: 'Jungle Cruise', window: '1:15', type: 'll' },
  { id: '4', ride: 'Big Thunder', window: '2:45', type: 'll' },
  { id: 'ill1', ride: 'Tron', window: '12:30', type: 'ill' },
  { id: 'ill2', ride: 'Guardians', window: '3:00', type: 'ill' },
];

interface LightningLaneTrackerProps {
  visible: boolean;
  tier?: ServiceTier;
}

/**
 * The Pocket Concierge Strip — Module 3 of the Boutique Pivot.
 *
 *  - Auto-scrolls (visually) to "what's next" via order
 *  - Active LL pulses in Burnished Gold
 *  - Past LLs collapse into a single "✓ N used" pill
 *  - Manager CTA only appears when AI has actually found a swap (witty copy)
 *  - Hidden for Sovereign tier (fully autonomous)
 *  - Hidden for Explorer tier (no upgrade)
 */
const LightningLaneTracker = ({ visible, tier = 'manager' }: LightningLaneTrackerProps) => {
  const { celebrate } = useCelebrate();

  const used = useMemo(() => RESERVATIONS.filter(r => r.used), []);
  const upcoming = useMemo(
    () => RESERVATIONS.filter(r => !r.used).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0)),
    []
  );
  const ill = useMemo(() => upcoming.filter(r => r.type === 'ill'), [upcoming]);
  const standard = useMemo(() => upcoming.filter(r => r.type === 'll'), [upcoming]);

  // Sovereign = invisible (it just happens). Explorer = no access (handled by parent).
  if (!visible || tier === 'sovereign') return null;

  // Simulated AI opportunity — only Manager tier sees the witty intervention
  const swapOpportunity = tier === 'manager';

  const acceptSwap = () => {
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Sniped');
  };

  return (
    <div className="bg-card/60 rounded-xl border border-border/60 p-3">
      {/* Header: brand + collapsed "used" pill + ILL count */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Zap size={10} className="text-accent" />
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
            Pocket Concierge
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {used.length > 0 && (
            <span className="font-sans text-[8px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-full">
              <Check size={9} />
              {used.length} used
            </span>
          )}
          {ill.length > 0 && (
            <span className="font-sans text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-sovereign">
              {ill.length} ILL
            </span>
          )}
        </div>
      </div>

      {/* Time-aware ribbon — horizontal scroll, active LL pulses */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
        {standard.map((res) => {
          const isActive = res.active;
          return (
            <motion.div
              key={res.id}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={isActive ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : {}}
              className={`shrink-0 min-w-[90px] rounded-lg px-2.5 py-2 text-center border transition-colors ${
                isActive
                  ? 'bg-accent/15 border-accent/50 shadow-boutique'
                  : 'bg-accent/5 border-accent/10'
              }`}
              style={
                isActive
                  ? { boxShadow: '0 0 0 1px hsl(var(--gold) / 0.3), 0 0 20px hsl(var(--gold) / 0.2)' }
                  : undefined
              }
            >
              <p className={`font-sans text-[10px] font-semibold truncate leading-tight ${
                isActive ? 'text-foreground' : 'text-foreground/80'
              }`}>
                {res.ride}
              </p>
              <span className={`font-sans text-[8px] tabular-nums ${
                isActive ? 'text-accent font-bold' : 'text-muted-foreground'
              }`}>
                {isActive ? 'OPEN NOW' : res.window}
              </span>
            </motion.div>
          );
        })}

        {/* ILL chips inline at end */}
        {ill.map((res) => (
          <div
            key={res.id}
            className="shrink-0 min-w-[80px] rounded-lg px-2.5 py-2 text-center bg-primary/8 border border-primary/15"
          >
            <p className="font-sans text-[9px] font-bold text-primary truncate leading-tight uppercase tracking-sovereign">
              ILL · {res.ride}
            </p>
            <span className="font-sans text-[8px] text-muted-foreground tabular-nums">
              {res.window}
            </span>
          </div>
        ))}
      </div>

      {/* Witty AI intervention — only when there's an actual opportunity */}
      {swapOpportunity && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={acceptSwap}
          className="w-full mt-2.5 py-2 bg-gradient-to-r from-accent/10 via-accent/15 to-accent/10 hover:from-accent/15 hover:to-accent/15 text-foreground font-sans text-[10px] border border-accent/30 cursor-pointer rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sparkles size={10} className="text-accent" />
          <span className="italic">Space Mountain just opened a back door. Take it?</span>
        </motion.button>
      )}
    </div>
  );
};

export default LightningLaneTracker;
