import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import DirectionalNowCard from './DirectionalNowCard';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';
import { useCompanion } from '@/contexts/CompanionContext';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  destination: string;
  wait?: string;
  status: 'now' | 'next' | 'later';
  llSecured?: boolean;
  type: 'ride' | 'dining' | 'show';
}

const AGENDA: TimelineEvent[] = [
  {
    id: '1',
    time: '10:15',
    title: 'Pirates of the Caribbean',
    location: 'Adventureland',
    destination: 'Adventureland',
    wait: '12 min',
    status: 'now',
    type: 'ride',
  },
  {
    id: '2',
    time: '11:00',
    title: 'Haunted Mansion',
    location: 'Liberty Square',
    destination: 'Liberty Square',
    wait: '25 min',
    status: 'next',
    llSecured: true,
    type: 'ride',
  },
];

interface NowCarouselProps {
  onSkip?: (rideTitle: string) => void;
}

const NowCarousel = ({ onSkip }: NowCarouselProps) => {
  const nowEvent = AGENDA.find((e) => e.status === 'now');
  const nextEvent = AGENDA.find((e) => e.status === 'next');
  const { celebrate } = useCelebrate();
  const { tier } = useCompanion();

  const handleCommit = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, "On Your Way");
  };

  const handleSkip = () => {
    if (!nowEvent) return;
    // Only Manager tier sees the AI swap sheet; others just dismiss.
    if (tier === 'manager' || tier === 'sovereign') {
      onSkip?.(nowEvent.title);
    }
  };

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-1.5 bg-accent rounded-full" />
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          Right Now
        </span>
      </div>

      {/* Directional now card */}
      {nowEvent && (
        <div className="mb-3">
          <DirectionalNowCard
            time={nowEvent.time}
            title={nowEvent.title}
            location={nowEvent.location}
            destination={nowEvent.destination}
            wait={nowEvent.wait}
            onSkip={handleSkip}
            onCommit={handleCommit}
          />
        </div>
      )}

      {/* Next up — compact strip */}
      {nextEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between bg-card/60 px-4 py-3 shadow-boutique rounded-xl"
        >
          <div className="flex items-center gap-3">
            <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold w-8">
              Next
            </span>
            <div>
              <span className="font-sans text-xs text-foreground font-medium">{nextEvent.title}</span>
              <span className="font-sans text-[10px] text-muted-foreground ml-2">{nextEvent.time}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nextEvent.llSecured && (
              <div className="flex items-center gap-1">
                <Zap size={9} className="text-accent" />
                <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">LL</span>
              </div>
            )}
            {nextEvent.wait && (
              <span className="font-sans text-[10px] text-muted-foreground tabular-nums">{nextEvent.wait}</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NowCarousel;
