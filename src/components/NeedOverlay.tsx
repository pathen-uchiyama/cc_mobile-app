import { MapPin, Clock, Utensils, Star, ExternalLink } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface NeedOverlayProps {
  type: 'bathroom' | 'quiet' | 'food';
  onClose: () => void;
  /** Current land/location of the user — drives proximity sort. */
  currentLocation?: string;
  /** Whether the traveling party includes children — drives service-style sort. */
  hasKids?: boolean;
}

const BATHROOMS = [
  { name: 'Adventureland Restrooms', distance: '2 min walk', crowd: 'Low', land: 'Adventureland' },
  { name: 'Fantasyland Restrooms (near Storybook)', distance: '4 min walk', crowd: 'Moderate', land: 'Fantasyland' },
  { name: 'Tomorrowland Restrooms', distance: '6 min walk', crowd: 'Low', land: 'Tomorrowland' },
];

const QUIET_SPACES = [
  { name: 'Tom Sawyer Island', distance: '5 min walk', note: 'Shaded benches, minimal foot traffic', land: 'Frontierland' },
  { name: 'Columbia Harbour House (upstairs)', distance: '3 min walk', note: 'Air conditioned, rarely crowded', land: 'Liberty Square' },
  { name: 'The Tomorrowland Transit Authority', distance: '4 min walk', note: 'Sit down, gentle breeze, low stimulation', land: 'Tomorrowland' },
];

type FoodService = 'sit-down' | 'quick-service' | 'snack';

interface FoodItem {
  name: string;
  land: string;
  walkMinutes: number;
  waitMinutes: number;
  service: FoodService;
  note: string;
  rating: number;
  yelpUrl: string;
}

const FOOD: FoodItem[] = [
  { name: 'Skipper Canteen', land: 'Adventureland', walkMinutes: 3, waitMinutes: 10, service: 'sit-down', note: 'Sit-down, mobile order open', rating: 4.2, yelpUrl: 'https://www.yelp.com/search?find_desc=Jungle+Navigation+Co+Skipper+Canteen&find_loc=Walt+Disney+World' },
  { name: 'Be Our Guest', land: 'Fantasyland', walkMinutes: 7, waitMinutes: 25, service: 'sit-down', note: 'Reservation-only, French menu', rating: 4.0, yelpUrl: 'https://www.yelp.com/search?find_desc=Be+Our+Guest+Restaurant&find_loc=Walt+Disney+World' },
  { name: 'Pecos Bill Tall Tale Inn', land: 'Frontierland', walkMinutes: 4, waitMinutes: 5, service: 'quick-service', note: 'Quick service, fixings bar', rating: 3.8, yelpUrl: 'https://www.yelp.com/search?find_desc=Pecos+Bill+Tall+Tale+Inn&find_loc=Walt+Disney+World' },
  { name: 'Cosmic Ray\u2019s Starlight Cafe', land: 'Tomorrowland', walkMinutes: 6, waitMinutes: 6, service: 'quick-service', note: 'Mobile order, three bays', rating: 3.9, yelpUrl: 'https://www.yelp.com/search?find_desc=Cosmic+Rays+Starlight+Cafe&find_loc=Walt+Disney+World' },
  { name: 'Sleepy Hollow Refreshments', land: 'Liberty Square', walkMinutes: 6, waitMinutes: 3, service: 'snack', note: 'Fresh waffles, walk-up window', rating: 4.4, yelpUrl: 'https://www.yelp.com/search?find_desc=Sleepy+Hollow+Refreshments&find_loc=Walt+Disney+World' },
  { name: 'Aloha Isle (Dole Whip)', land: 'Adventureland', walkMinutes: 2, waitMinutes: 8, service: 'snack', note: 'Iconic pineapple soft serve', rating: 4.6, yelpUrl: 'https://www.yelp.com/search?find_desc=Aloha+Isle&find_loc=Walt+Disney+World' },
];

/**
 * Refuel sort:
 *   1. Proximity — same land first, then nearer walk.
 *   2. Service style by party — kids => quick-service + snack first; no kids => sit-down first.
 *   3. Tie-break by wait time.
 */
const sortFood = (items: FoodItem[], currentLocation?: string, hasKids?: boolean): FoodItem[] => {
  const serviceRank = (s: FoodService) =>
    hasKids
      ? { 'quick-service': 0, snack: 1, 'sit-down': 2 }[s]
      : { 'sit-down': 0, 'quick-service': 1, snack: 2 }[s];

  return [...items].sort((a, b) => {
    if (currentLocation) {
      const aLocal = a.land === currentLocation ? 0 : 1;
      const bLocal = b.land === currentLocation ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
    }
    const sr = serviceRank(a.service) - serviceRank(b.service);
    if (sr !== 0) return sr;
    if (a.walkMinutes !== b.walkMinutes) return a.walkMinutes - b.walkMinutes;
    return a.waitMinutes - b.waitMinutes;
  });
};

const NeedOverlay = ({ type, onClose, currentLocation, hasKids }: NeedOverlayProps) => {
  if (type === 'food') {
    const sorted = sortFood(FOOD, currentLocation, hasKids);
    const subtitle = currentLocation
      ? `Closest to ${currentLocation} · ${hasKids ? 'quick service first for the kids' : 'sit-down first'}`
      : `${hasKids ? 'Quick service first for the kids' : 'Sit-down first'}, then ranked by walk + wait`;

    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        snap="half"
        eyebrow="Refuel"
        title="Refuel Nearby"
        subtitle={subtitle}
      >
        <div className="space-y-3">
          {sorted.map((item) => (
            <div key={item.name} className="bg-card p-4 shadow-boutique rounded-xl">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-sans text-sm font-semibold text-foreground">{item.name}</h3>
                <span
                  className="font-sans text-[9px] uppercase tracking-sovereign font-bold shrink-0 px-1.5 py-0.5 rounded-full"
                  style={{
                    color: 'hsl(var(--gold))',
                    background: 'hsl(var(--gold) / 0.10)',
                    letterSpacing: '0.14em',
                  }}
                >
                  {item.service === 'sit-down' ? 'Sit-Down' : item.service === 'quick-service' ? 'Quick' : 'Snack'}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    {item.land} · {item.walkMinutes} min walk
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Utensils size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    Wait: <span className="text-foreground font-semibold">{item.waitMinutes} min</span>
                  </span>
                </div>
                <span className="font-sans text-[10px] text-muted-foreground italic">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    );
  }

  const items = type === 'bathroom' ? BATHROOMS : QUIET_SPACES;
  const title = type === 'bathroom' ? 'Nearest Restrooms' : 'Quiet Spaces Nearby';
  const subtitle = type === 'bathroom'
    ? 'Sorted by proximity to your current location'
    : 'Low-stimulation zones for when you need a reset';
  const eyebrow = type === 'bathroom' ? 'Nearby Relief' : 'Quiet Companion';

  return (
    <BottomSheet
      open={true}
      onClose={onClose}
      snap="half"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-card p-4 shadow-boutique rounded-xl">
            <h3 className="font-sans text-sm font-semibold text-foreground mb-2">{item.name}</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-muted-foreground" />
                <span className="font-sans text-[10px] text-muted-foreground">{item.distance}</span>
              </div>
              {'crowd' in item && (
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    Crowd: <span className="text-foreground font-semibold">{item.crowd}</span>
                  </span>
                </div>
              )}
              {'note' in item && (
                <span className="font-sans text-[10px] text-muted-foreground italic">{item.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};

export default NeedOverlay;
