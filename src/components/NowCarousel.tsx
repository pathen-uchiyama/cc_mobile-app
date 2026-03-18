import { motion } from 'framer-motion';
import { MapPin, Clock, Zap } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
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
    wait: '12 min',
    status: 'now',
    type: 'ride',
  },
  {
    id: '2',
    time: '11:00',
    title: 'Haunted Mansion',
    location: 'Liberty Square',
    wait: '25 min',
    status: 'next',
    llSecured: true,
    type: 'ride',
  },
  {
    id: '3',
    time: '11:30',
    title: 'Be Our Guest Restaurant',
    location: 'Fantasyland',
    status: 'later',
    type: 'dining',
  },
  {
    id: '4',
    time: '13:00',
    title: 'Festival of Fantasy Parade',
    location: 'Main Street U.S.A.',
    status: 'later',
    type: 'show',
  },
  {
    id: '5',
    time: '14:30',
    title: 'Space Mountain',
    location: 'Tomorrowland',
    wait: '45 min',
    status: 'later',
    llSecured: true,
    type: 'ride',
  },
];

const NowCarousel = () => {
  const nowEvent = AGENDA.find(e => e.status === 'now');
  const nextEvent = AGENDA.find(e => e.status === 'next');

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-1.5 bg-accent" />
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          Right Now
        </span>
      </div>

      {/* Current moment — hero card */}
      {nowEvent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-5 shadow-boutique rounded-xl mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 bg-accent rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              Happening Now
            </span>
            <span className="font-sans tabular-nums text-sm text-foreground font-semibold">
              {nowEvent.time}
            </span>
          </div>
          <h3 className="font-display text-xl text-foreground mb-1">{nowEvent.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MapPin size={10} className="text-muted-foreground" />
                <span className="font-sans text-[10px] text-muted-foreground">{nowEvent.location}</span>
              </div>
            </div>
            {nowEvent.wait && (
              <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full">
                <Clock size={10} className="text-accent" />
                <span className="font-sans text-[11px] text-accent font-bold tabular-nums">{nowEvent.wait}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Next up — compact strip */}
      {nextEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between bg-card/60 px-4 py-3 shadow-boutique"
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
