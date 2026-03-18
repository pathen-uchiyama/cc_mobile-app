import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

interface RideEntry {
  id: string;
  name: string;
  land: string;
  postedWait: number;
  expectedWait?: number;
  status: 'normal' | 'faster' | 'avoid' | 'closed';
}

const RIDES: RideEntry[] = [
  { id: '1', name: 'Space Mountain', land: 'Tomorrowland', postedWait: 65, expectedWait: 45, status: 'faster' },
  { id: '2', name: 'Pirates of the Caribbean', land: 'Adventureland', postedWait: 25, status: 'normal' },
  { id: '3', name: 'Seven Dwarfs Mine Train', land: 'Fantasyland', postedWait: 90, status: 'avoid' },
  { id: '4', name: 'Haunted Mansion', land: 'Liberty Square', postedWait: 35, expectedWait: 28, status: 'faster' },
  { id: '5', name: 'Big Thunder Mountain', land: 'Frontierland', postedWait: 50, status: 'normal' },
  { id: '6', name: 'Jungle Cruise', land: 'Adventureland', postedWait: 40, status: 'normal' },
  { id: '7', name: 'Tron Lightcycle Run', land: 'Tomorrowland', postedWait: 75, status: 'avoid' },
  { id: '8', name: "It's a Small World", land: 'Fantasyland', postedWait: 15, expectedWait: 10, status: 'faster' },
];

const IntelligentGuide = () => {
  const [search, setSearch] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  const filtered = RIDES.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.land.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-6 pt-4 pb-32 relative">
      {/* Sniping Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            className="fixed top-[60px] left-4 right-4 z-[9997] max-w-[448px] mx-auto bg-card p-4 shadow-boutique-hover border-l-4 border-gold cursor-pointer"
            onClick={() => setShowBanner(false)}
          >
            <p className="font-sans text-xs text-foreground leading-relaxed">
              <span className="text-gold font-bold">↑ Opportunity.</span> Rise of the Resistance has reopened. We have auto-substituted your Lightning Lane to secure it before the crowd returns.
            </p>
            <span className="font-sans text-[9px] text-muted-foreground uppercase tracking-sovereign mt-1 block">Tap to dismiss</span>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="font-display text-2xl text-foreground mb-1">The Intelligent Guide</h2>
      <p className="font-sans text-xs text-muted-foreground mb-6 uppercase tracking-sovereign">Logic over luck.</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rides, lands..."
          className="w-full bg-card border border-slate-divider py-3 pl-11 pr-4 font-sans text-sm text-foreground outline-none focus:border-obsidian transition-colors shadow-boutique"
        />
      </div>

      {/* Ride List */}
      <div className="space-y-3">
        {filtered.map((ride) => (
          <motion.div
            key={ride.id}
            layout
            className="bg-card p-5 shadow-boutique"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                <h3 className="font-display text-base text-foreground mb-1">{ride.name}</h3>
                <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">{ride.land}</span>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span className="font-sans tabular-nums text-2xl font-light text-foreground">
                  {ride.postedWait}<span className="text-xs text-muted-foreground ml-0.5">m</span>
                </span>

                {ride.status === 'faster' && ride.expectedWait && (
                  <span className="px-2 py-0.5 bg-gold/15 text-gold text-[9px] uppercase tracking-tighter font-bold">
                    Expected: {ride.expectedWait}m
                  </span>
                )}
                {ride.status === 'avoid' && (
                  <span className="px-2 py-0.5 bg-obsidian/10 text-foreground text-[9px] uppercase tracking-tighter font-bold">
                    Avoid
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IntelligentGuide;
