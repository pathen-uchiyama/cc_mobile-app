import { motion } from 'framer-motion';
import { Clock, MapPin, Sparkles, CloudRain, Umbrella } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';

interface SwapOption {
  id: string;
  ride: string;
  area: string;
  wait: string;
  reason: string;
  /** Optional category badge to telegraph "indoor", "show", "break", "now". */
  kind?: 'indoor' | 'show' | 'break' | 'now';
}

// Default options shown when the pivot wasn't triggered by a specific signal.
const DEFAULT_OPTIONS: SwapOption[] = [
  { id: '1', ride: 'Big Thunder Mountain', area: 'Frontierland', wait: '8 min', reason: 'Walk-on window opening — won\'t last' },
  { id: '2', ride: 'Jungle Cruise', area: 'Adventureland', wait: '14 min', reason: 'On your route, low queue' },
  { id: '3', ride: 'Tiki Room (refresh)', area: 'Adventureland', wait: '2 min', reason: 'Air conditioned · 12 min show' },
];

// Rain-specific roster: prioritizes covered/indoor rides, sit-down shows,
// indoor breaks, and one "do it now before the queue swells" outdoor pick.
const RAIN_OPTIONS: SwapOption[] = [
  { id: 'r-now',    ride: 'Big Thunder Mountain',    area: 'Frontierland',  wait: '8 min',  reason: 'Ride NOW — outdoor queue empties the moment rain hits', kind: 'now' },
  { id: 'r-pirates',ride: 'Pirates of the Caribbean',area: 'Adventureland', wait: '15 min', reason: 'Fully indoor · queue is covered end to end',           kind: 'indoor' },
  { id: 'r-mansion',ride: 'Haunted Mansion',         area: 'Liberty Square',wait: '20 min', reason: 'Indoor queue + indoor ride · stays dry',               kind: 'indoor' },
  { id: 'r-tiki',   ride: 'Tiki Room',               area: 'Adventureland', wait: '2 min',  reason: 'Air conditioned · 12 min show — perfect shelter',      kind: 'show' },
  { id: 'r-break',  ride: 'Sleepy Hollow Refreshments', area: 'Liberty Square', wait: '5 min', reason: 'Covered seating · funnel cake while it passes',     kind: 'break' },
];

interface SwapSuggestionsSheetProps {
  open: boolean;
  onClose: () => void;
  /** The ride the user just swiped away from. */
  skipped?: string;
  /** Why the swap was triggered — drives the rationale banner + suggestions. */
  reason?: 'rain' | 'closure' | 'manual';
}

const KIND_BADGE: Record<NonNullable<SwapOption['kind']>, { label: string; tone: string }> = {
  indoor: { label: 'Indoor',  tone: 'bg-accent/15 text-accent border-accent/40' },
  show:   { label: 'Show',    tone: 'bg-accent/15 text-accent border-accent/40' },
  break:  { label: 'Break',   tone: 'bg-muted text-muted-foreground border-border' },
  now:    { label: 'Do now',  tone: 'bg-foreground/90 text-background border-foreground' },
};

const SwapSuggestionsSheet = ({ open, onClose, skipped, reason = 'manual' }: SwapSuggestionsSheetProps) => {
  const { celebrate } = useCelebrate();
  const isRain = reason === 'rain';
  const options = isRain ? RAIN_OPTIONS : DEFAULT_OPTIONS;

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
      eyebrow={isRain ? '☔ Weather Pivot' : '✨ AI Swap Suggestions'}
      title={isRain ? 'Rain incoming — let\'s stay dry' : skipped ? `Skipping ${skipped}?` : 'Pivot the plan'}
      subtitle={
        isRain
          ? 'Indoor rides, covered shows, and a sheltered break — plus one outdoor pick to grab right now.'
          : 'Three nearby alternatives, ranked by signal.'
      }
    >
      {/* Weather rationale banner — explains WHY we're suggesting this pivot. */}
      {isRain && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-xl p-3.5 mb-4"
        >
          <CloudRain size={18} className="text-accent shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[11px] uppercase tracking-sovereign text-accent font-bold mb-0.5">
              Rain in ~20 min
            </p>
            <p className="font-sans text-[12px] text-foreground leading-snug">
              A passing shower is closing in. Outdoor queues will swell as guests rush for cover —
              we\'re steering you to indoor rides &amp; shows, or a break until it passes.
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-2.5">
        {options.map((opt, i) => (
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
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-display text-base text-foreground truncate">{opt.ride}</h3>
                  {opt.kind && (
                    <span className={`shrink-0 inline-flex items-center gap-1 border rounded-full px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-sovereign font-bold ${KIND_BADGE[opt.kind].tone}`}>
                      {opt.kind === 'indoor' && <Umbrella size={8} />}
                      {KIND_BADGE[opt.kind].label}
                    </span>
                  )}
                </div>
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
