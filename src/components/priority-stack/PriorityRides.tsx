import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';

interface PriorityRide {
  id: string;
  name: string;
  land: string;
  votes: number;
  trend?: 'up' | 'flat';
}

interface PriorityRidesProps {
  rides?: PriorityRide[];
}

const DEFAULT_RIDES: PriorityRide[] = [
  { id: 'r1', name: 'Tron Lightcycle Run',     land: 'Tomorrowland',  votes: 4_812, trend: 'up' },
  { id: 'r2', name: 'Seven Dwarfs Mine Train', land: 'Fantasyland',   votes: 3_647, trend: 'up' },
  { id: 'r3', name: 'Space Mountain',          land: 'Tomorrowland',  votes: 2_984, trend: 'flat' },
  { id: 'r4', name: 'Big Thunder Mountain',    land: 'Frontierland',  votes: 2_215, trend: 'up' },
  { id: 'r5', name: 'Pirates of the Caribbean',land: 'Adventureland', votes: 1_708, trend: 'flat' },
];

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

/**
 * Priority Rides — community-voted ranking.
 *
 * Shows the rides the crowd has voted as "must do today,"
 * with vote counts and trend indicators.
 */
const PriorityRides = ({ rides = DEFAULT_RIDES }: PriorityRidesProps) => {
  return (
    <section aria-label="Priority rides — voted by guests today">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          Priority Rides · Voted Today
        </span>
        <span className="font-sans text-[9px] flex items-center gap-1" style={{ color: 'hsl(var(--gold))' }}>
          <Users size={10} />
          <span className="font-semibold tabular-nums">
            {formatVotes(rides.reduce((s, r) => s + r.votes, 0))}
          </span>
        </span>
      </div>

      <ol className="space-y-2 list-none p-0 m-0">
        {rides.map((ride, i) => (
          <motion.li
            key={ride.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 mx-auto"
            style={{
              width: '90%',
              boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)',
            }}
          >
            {/* Rank */}
            <span
              className="font-display text-[18px] tabular-nums w-6 text-center"
              style={{ color: 'hsl(var(--gold))' }}
            >
              {i + 1}
            </span>

            {/* Ride + land */}
            <div className="flex-1 min-w-0">
              <p className="font-display text-[15px] leading-tight text-foreground truncate">
                {ride.name}
              </p>
              <p className="font-sans text-[10px] mt-0.5" style={{ color: 'hsl(var(--slate-plaid))' }}>
                {ride.land}
              </p>
            </div>

            {/* Vote count */}
            <div className="shrink-0 flex items-center gap-1.5 bg-secondary-container px-2.5 py-1 rounded-full">
              <Users size={10} className="text-primary" />
              <span className="font-sans text-[11px] font-bold text-primary tabular-nums">
                {formatVotes(ride.votes)}
              </span>
              {ride.trend === 'up' && (
                <TrendingUp size={9} className="text-primary" />
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
};

export default PriorityRides;
