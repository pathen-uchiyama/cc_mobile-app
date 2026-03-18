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

const statusDot: Record<string, string> = {
  now: 'bg-accent',
  next: 'bg-primary',
  later: 'bg-muted-foreground/30',
};

const NowCarousel = () => {
  return (
    <div className="relative">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-1.5 bg-accent" />
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          Today's Timeline
        </span>
      </div>

      {/* Flighty-style vertical timeline */}
      <div className="relative ml-[52px]">
        {/* Vertical connector line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

        {AGENDA.map((event, i) => {
          const isActive = event.status === 'now';
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative pb-8 last:pb-0 ${isActive ? '' : 'opacity-70'}`}
            >
              {/* Time — positioned to the left of the line */}
              <span
                className={`absolute right-full mr-5 top-0 font-sans tabular-nums text-sm ${
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-light'
                }`}
              >
                {event.time}
              </span>

              {/* Dot on the line */}
              <div className="absolute left-0 top-1 -translate-x-1/2">
                <div className={`w-2.5 h-2.5 ${statusDot[event.status]}`} />
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-accent/30"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>

              {/* Event card */}
              <div className={`ml-6 ${isActive ? 'bg-card p-5 shadow-boutique' : 'pl-5'}`}>
                {isActive && (
                  <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold block mb-2">
                    Happening Now
                  </span>
                )}
                <h3 className={`font-display ${isActive ? 'text-xl' : 'text-base'} text-foreground mb-1`}>
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <MapPin size={10} className="text-muted-foreground" />
                    <span className="font-sans text-[10px] text-muted-foreground">{event.location}</span>
                  </div>
                  {event.wait && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-muted-foreground" />
                      <span className="font-sans text-[10px] text-muted-foreground">
                        <span className="text-foreground font-semibold">{event.wait}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* LL badge */}
                {event.llSecured && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Zap size={9} className="text-accent" />
                    <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
                      Lightning Lane
                    </span>
                  </div>
                )}

                {/* Dining */}
                {event.type === 'dining' && (
                  <div className="mt-2.5">
                    <span className="font-sans text-[8px] uppercase tracking-sovereign text-foreground font-bold">
                      Reservation Locked
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NowCarousel;
