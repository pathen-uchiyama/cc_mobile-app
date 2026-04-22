import { MapPin, Clock, Utensils, Star, ExternalLink, Snowflake, Wind, Sun } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface NeedOverlayProps {
  type: 'bathroom' | 'quiet' | 'food' | 'cooldown';
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

/**
 * Cool-down inventory — a temperature-first roster the guest can scan when the
 * heat starts to win. Categories are intentionally varied so the right answer
 * is on-screen no matter the moment: a long indoor ride for full reset, a
 * lounge for a sit-down with A/C, a quick-service bay to eat *and* cool, or a
 * shaded outdoor zone when committing to indoors feels like overkill.
 *
 * `coolingTier` drives both the visual icon and the sort order:
 *   • 'ac'      — fully air-conditioned interior
 *   • 'shaded'  — covered/shaded outdoor with breeze
 *   • 'misted'  — outdoor with active misting/water cooling
 */
type CoolingTier = 'ac' | 'shaded' | 'misted';
type CoolKind = 'ride' | 'lounge' | 'restaurant' | 'area' | 'show';

interface CoolDownItem {
  name: string;
  land: string;
  walkMinutes: number;
  kind: CoolKind;
  coolingTier: CoolingTier;
  duration: string;
  note: string;
}

const COOLDOWN: CoolDownItem[] = [
  { name: 'Carousel of Progress',           land: 'Tomorrowland',  walkMinutes: 5, kind: 'ride',       coolingTier: 'ac',     duration: '21 min', note: 'Full A/C, walk-on, four scenes — best long reset in the park' },
  { name: 'Walt Disney\u2019s Enchanted Tiki Room', land: 'Adventureland', walkMinutes: 4, kind: 'show', coolingTier: 'ac',     duration: '15 min', note: 'Sit down, dim, classic A/C theatre' },
  { name: 'Country Bear Musical Jamboree',  land: 'Frontierland',  walkMinutes: 6, kind: 'show',       coolingTier: 'ac',     duration: '15 min', note: 'Indoor theatre, low-stim, family-friendly' },
  { name: 'Pirates of the Caribbean',       land: 'Adventureland', walkMinutes: 3, kind: 'ride',       coolingTier: 'ac',     duration: '10 min', note: 'Indoor boat ride — cool air the whole way' },
  { name: 'Haunted Mansion (queue + ride)', land: 'Liberty Square', walkMinutes: 5, kind: 'ride',      coolingTier: 'ac',     duration: '12 min', note: 'Stretching room and ride are both indoors' },
  { name: 'Columbia Harbour House (upstairs)', land: 'Liberty Square', walkMinutes: 3, kind: 'restaurant', coolingTier: 'ac', duration: '20\u201330 min', note: 'A/C, second-floor seating, mobile order' },
  { name: 'Skipper Canteen Lounge',         land: 'Adventureland', walkMinutes: 3, kind: 'lounge',     coolingTier: 'ac',     duration: '20\u201340 min', note: 'A/C, walk-up bar, light bites' },
  { name: 'Cosmic Ray\u2019s Starlight Cafe', land: 'Tomorrowland', walkMinutes: 6, kind: 'restaurant', coolingTier: 'ac',    duration: '20 min', note: 'Big A/C dining hall, three menu bays' },
  { name: 'Sunshine Tree Terrace (covered)', land: 'Adventureland', walkMinutes: 2, kind: 'area',     coolingTier: 'shaded', duration: '5\u201310 min', note: 'Citrus swirl + shaded benches under the canopy' },
  { name: 'Adventureland Veranda',          land: 'Adventureland', walkMinutes: 3, kind: 'area',       coolingTier: 'shaded', duration: '10 min', note: 'Covered walkway, ceiling fans, breeze off the water' },
  { name: 'Casey\u2019s Corner Mister Wall', land: 'Main Street, U.S.A.', walkMinutes: 7, kind: 'area', coolingTier: 'misted', duration: '5 min', note: 'Active mist line — fastest temp drop in the park' },
];

/**
 * Cool-down sort rules:
 *   1. Same-land first so the guest doesn't have to march to relief.
 *   2. Cooling tier — full A/C wins, then misted, then shaded. Misted beats
 *      shaded because active water cooling drops body temp faster.
 *   3. Tie-break by walk minutes.
 */
const sortCooldown = (items: CoolDownItem[], currentLocation?: string): CoolDownItem[] => {
  const tierRank: Record<CoolingTier, number> = { ac: 0, misted: 1, shaded: 2 };
  return [...items].sort((a, b) => {
    if (currentLocation) {
      const aLocal = a.land === currentLocation ? 0 : 1;
      const bLocal = b.land === currentLocation ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
    }
    const tr = tierRank[a.coolingTier] - tierRank[b.coolingTier];
    if (tr !== 0) return tr;
    return a.walkMinutes - b.walkMinutes;
  });
};

const KIND_LABEL: Record<CoolKind, string> = {
  ride: 'Ride',
  show: 'Show',
  lounge: 'Lounge',
  restaurant: 'Eat & Cool',
  area: 'Outdoor Spot',
};

const TIER_META: Record<CoolingTier, { label: string; Icon: typeof Snowflake }> = {
  ac:     { label: 'Full A/C',  Icon: Snowflake },
  misted: { label: 'Misted',    Icon: Wind },
  shaded: { label: 'Shaded',    Icon: Sun },
};

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
  cuisine: string;
  signature: string;
  priceTier: '$' | '$$' | '$$$';
  dietary: string[];
}

const FOOD: FoodItem[] = [
  { name: 'Skipper Canteen', land: 'Adventureland', walkMinutes: 3, waitMinutes: 10, service: 'sit-down', note: 'Sit-down, mobile order open', rating: 4.2, yelpUrl: 'https://www.yelp.com/search?find_desc=Jungle+Navigation+Co+Skipper+Canteen&find_loc=Walt+Disney+World', cuisine: 'Pan-Asian / Latin', signature: 'Falls Family Falafel · Char Siu Pork', priceTier: '$$', dietary: ['Veg', 'GF'] },
  { name: 'Be Our Guest', land: 'Fantasyland', walkMinutes: 7, waitMinutes: 25, service: 'sit-down', note: 'Reservation-only, French menu', rating: 4.0, yelpUrl: 'https://www.yelp.com/search?find_desc=Be+Our+Guest+Restaurant&find_loc=Walt+Disney+World', cuisine: 'French', signature: 'Filet Mignon · The Grey Stuff', priceTier: '$$$', dietary: ['Veg'] },
  { name: 'Pecos Bill Tall Tale Inn', land: 'Frontierland', walkMinutes: 4, waitMinutes: 5, service: 'quick-service', note: 'Quick service, fixings bar', rating: 3.8, yelpUrl: 'https://www.yelp.com/search?find_desc=Pecos+Bill+Tall+Tale+Inn&find_loc=Walt+Disney+World', cuisine: 'Tex-Mex', signature: 'Beef Nachos · Burrito Bowl', priceTier: '$', dietary: ['Veg', 'GF'] },
  { name: 'Cosmic Ray\u2019s Starlight Cafe', land: 'Tomorrowland', walkMinutes: 6, waitMinutes: 6, service: 'quick-service', note: 'Mobile order, three bays', rating: 3.9, yelpUrl: 'https://www.yelp.com/search?find_desc=Cosmic+Rays+Starlight+Cafe&find_loc=Walt+Disney+World', cuisine: 'American', signature: 'Rotisserie Chicken · Bacon Cheeseburger', priceTier: '$', dietary: ['Kids', 'GF'] },
  { name: 'Sleepy Hollow Refreshments', land: 'Liberty Square', walkMinutes: 6, waitMinutes: 3, service: 'snack', note: 'Fresh waffles, walk-up window', rating: 4.4, yelpUrl: 'https://www.yelp.com/search?find_desc=Sleepy+Hollow+Refreshments&find_loc=Walt+Disney+World', cuisine: 'Sweet & Savory Waffles', signature: 'Nutella-Fruit Waffle · Sweet-Spicy Chicken', priceTier: '$', dietary: ['Veg'] },
  { name: 'Aloha Isle (Dole Whip)', land: 'Adventureland', walkMinutes: 2, waitMinutes: 8, service: 'snack', note: 'Iconic pineapple soft serve', rating: 4.6, yelpUrl: 'https://www.yelp.com/search?find_desc=Aloha+Isle&find_loc=Walt+Disney+World', cuisine: 'Frozen Treats', signature: 'Pineapple Dole Whip · Float', priceTier: '$', dietary: ['Veg', 'Vegan', 'GF'] },
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
              {/* Row 1 — name + stars (left), service tag (right) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-sans text-sm font-semibold text-foreground truncate">{item.name}</h3>
                  <span
                    className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded-full"
                    style={{ background: 'hsl(var(--gold) / 0.10)' }}
                    aria-label={`${item.rating} out of 5 stars`}
                  >
                    <Star size={10} className="fill-current" style={{ color: 'hsl(var(--gold))' }} />
                    <span className="font-sans text-[10px] font-bold" style={{ color: 'hsl(var(--gold))' }}>
                      {item.rating.toFixed(1)}
                    </span>
                  </span>
                  <a
                    href={item.yelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-sovereign font-bold shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: 'hsl(var(--gold))', letterSpacing: '0.14em' }}
                  >
                    Yelp
                    <ExternalLink size={10} />
                  </a>
                </div>
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
              {/* Row 2 — cuisine · price · signature dish · dietary tags */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-sans text-[10px] font-semibold text-foreground">
                  {item.cuisine}
                </span>
                <span className="font-sans text-[10px] text-muted-foreground">·</span>
                <span
                  className="font-sans text-[10px] font-bold"
                  style={{ color: 'hsl(var(--gold))' }}
                  aria-label={`Price tier ${item.priceTier}`}
                >
                  {item.priceTier}
                </span>
                <span className="font-sans text-[10px] text-muted-foreground italic truncate min-w-0">
                  · {item.signature}
                </span>
                {item.dietary.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    {item.dietary.map((tag) => (
                      <span
                        key={tag}
                        className="font-sans text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: 'hsl(var(--obsidian))',
                          background: 'hsl(var(--obsidian) / 0.06)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Row 3 — land/walk (left), wait time (right) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground truncate">
                    {item.land} · {item.walkMinutes}m
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Utensils size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    Wait <span className="text-foreground font-semibold">{item.waitMinutes}m</span>
                  </span>
                </div>
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
