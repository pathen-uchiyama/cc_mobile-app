import { motion } from 'framer-motion';
import { Clock, MapPin, Sparkles, CloudRain, Home, Coffee, Zap, Theater } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';

type SwapKind = 'now' | 'indoor' | 'show' | 'break' | 'outdoor';
export type SwapReason = 'rain' | 'closure' | 'manual';

interface SwapOption {
  id: string;
  ride: string;
  area: string;
  wait: string;
  reason: string;
  kind: SwapKind;
}

const DEFAULT_OPTIONS: SwapOption[] = [
  { id: 'd-1', ride: 'Big Thunder Mountain', area: 'Frontierland', wait: '8 min',  reason: 'Walk-on window opening — won\u2019t last', kind: 'now' },
  { id: 'd-2', ride: 'Jungle Cruise',        area: 'Adventureland', wait: '14 min', reason: 'On your route, low queue',                  kind: 'outdoor' },
  { id: 'd-3', ride: 'Tiki Room (refresh)',  area: 'Adventureland', wait: '2 min',  reason: 'Air conditioned \u00b7 12 min show',         kind: 'show' },
];

const RAIN_OPTIONS: SwapOption[] = [
  { id: 'r-pirates', ride: 'Pirates of the Caribbean', area: 'Adventureland',  wait: '12 min', reason: 'Fully indoor \u00b7 queue is covered',         kind: 'indoor' },
  { id: 'r-mansion', ride: 'Haunted Mansion',          area: 'Liberty Square', wait: '20 min', reason: 'Indoor ride \u00b7 stretching room is dry',    kind: 'indoor' },
  { id: 'r-tiki',    ride: 'Enchanted Tiki Room',      area: 'Adventureland',  wait: '2 min',  reason: 'Covered show \u00b7 12 min sit-down',          kind: 'show' },
  { id: 'r-cafe',    ride: 'Sleepy Hollow Snacks',     area: 'Liberty Square', wait: '5 min',  reason: 'Covered patio \u00b7 wait it out with a treat', kind: 'break' },
  { id: 'r-now',     ride: 'Big Thunder Mountain',     area: 'Frontierland',   wait: '8 min',  reason: 'Ride NOW \u2014 outdoor queue empties when rain hits', kind: 'now' },
];

const KIND_ORDER: Record<SwapKind, number> = { now: 0, indoor: 1, show: 2, break: 3, outdoor: 4 };

const KIND_BADGE: Record<SwapKind, { label: string; Icon: typeof Home; cls: string }> = {
  now:     { label: 'Do now', Icon: Zap,     cls: 'bg-accent/20 text-accent border-accent/40' },
  indoor:  { label: 'Indoor', Icon: Home,    cls: 'bg-primary/15 text-primary border-primary/30' },
  show:    { label: 'Show',   Icon: Theater, cls: 'bg-primary/15 text-primary border-primary/30' },
  break:   { label: 'Break',  Icon: Coffee,  cls: 'bg-primary/15 text-primary border-primary/30' },
  outdoor: { label: 'Outdoor', Icon: MapPin, cls: 'bg-muted text-muted-foreground border-border' },
};

interface SwapSuggestionsSheetProps {
  open: boolean;
  onClose: () => void;
  /** The ride the user just swiped away from. */
  skipped?: string;
  /** Why we're suggesting a pivot — drives the roster + rationale banner. */
  reason?: SwapReason;
}

const SwapSuggestionsSheet = ({ open, onClose, skipped, reason = 'manual' }: SwapSuggestionsSheetProps) => {
  const { celebrate } = useCelebrate();

  const isRain = reason === 'rain';
  const roster = isRain ? RAIN_OPTIONS : DEFAULT_OPTIONS;
  // Visual ordering: 'Do now' first, then indoor/show/break, outdoor last.
  const options = [...roster].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);

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
      eyebrow={isRain ? '\u2601\ufe0f Weather Pivot' : '\u2728 AI Swap Suggestions'}
      title={isRain ? 'Rain in ~20 min' : skipped ? `Skipping ${skipped}?` : 'Pivot the plan'}
      subtitle={isRain
        ? 'Stay dry — indoor rides, covered shows, breaks, or get an outdoor pick done now.'
        : 'Three nearby alternatives, ranked by signal.'}
    >
      {isRain && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 p-3"
        >
          <CloudRain size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-sans text-[11px] text-foreground leading-snug">
              <span className="font-semibold">Why this pivot:</span> radar shows a band moving in. We\u2019re prioritizing indoor rides and covered shows, with one outdoor pick to ride <em>before</em> it starts.
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const badge = KIND_BADGE[opt.kind];
          const BadgeIcon = badge.Icon;
          return (
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base text-foreground truncate">{opt.ride}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold ${badge.cls}`}>
                    <BadgeIcon size={9} />
                    {badge.label}
                  </span>
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
          );
        })}
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
