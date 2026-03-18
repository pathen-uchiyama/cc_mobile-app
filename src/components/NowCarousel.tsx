import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ChevronRight, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgendaCard {
  id: string;
  time: string;
  title: string;
  location: string;
  wait?: string;
  status: 'now' | 'next' | 'later';
  llSecured?: boolean;
  type: 'ride' | 'dining' | 'show';
}

const AGENDA: AgendaCard[] = [
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
];

const statusStyles = {
  now: 'border-l-accent',
  next: 'border-l-primary',
  later: 'border-l-muted-foreground',
};

const statusLabel = {
  now: 'Happening Now',
  next: 'Up Next',
  later: 'Coming Up',
};

const NowCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">Your Day</h2>
          <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mt-1">Scroll for what's ahead</p>
        </div>
        <button
          onClick={() => navigate('/itinerary')}
          className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-border cursor-pointer min-h-[44px]"
          aria-label="Edit plan"
        >
          <Pencil size={13} className="text-muted-foreground" />
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">Edit</span>
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {AGENDA.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`snap-start shrink-0 w-[85%] bg-card p-6 shadow-boutique border-l-4 ${statusStyles[card.status]}`}
          >
            {/* Status label */}
            <span className={`font-sans text-[9px] uppercase tracking-sovereign block mb-3 ${
              card.status === 'now' ? 'text-accent font-bold' : 'text-muted-foreground'
            }`}>
              {statusLabel[card.status]}
            </span>

            {/* Time */}
            <span className="font-sans tabular-nums text-3xl font-light text-foreground block mb-1">
              {card.time}
            </span>

            {/* Title */}
            <h3 className="font-display text-xl text-foreground mb-2">{card.title}</h3>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-muted-foreground" />
                <span className="font-sans text-[10px] text-muted-foreground">{card.location}</span>
              </div>
              {card.wait && (
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">Wait: <span className="text-foreground font-semibold">{card.wait}</span></span>
                </div>
              )}
            </div>

            {/* Lightning Lane badge */}
            {card.llSecured && (
              <div className="mt-4 px-3 py-2 bg-accent/10 inline-flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-accent" />
                <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">Lightning Lane Secured</span>
              </div>
            )}

            {/* Dining indicator */}
            {card.type === 'dining' && (
              <div className="mt-4 px-3 py-2 bg-muted inline-flex items-center gap-2">
                <span className="font-sans text-[9px] uppercase tracking-sovereign text-foreground font-bold">Reservation Locked</span>
              </div>
            )}
          </motion.div>
        ))}

        {/* See full plan card */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/itinerary')}
          className="snap-start shrink-0 w-[60%] bg-card p-6 shadow-boutique flex flex-col items-center justify-center cursor-pointer border-none min-h-[200px]"
        >
          <ChevronRight size={24} className="text-muted-foreground mb-3" />
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">View Full Plan</span>
        </motion.button>
      </div>
    </div>
  );
};

export default NowCarousel;
