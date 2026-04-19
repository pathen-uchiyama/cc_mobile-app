import { useEffect, useMemo, useState } from 'react';

/**
 * Context-aware whisper engine.
 *
 * Generates whispers from:
 *  - Time of day (morning / midday / afternoon / evening)
 *  - Simulated proximity to attractions (rotates every 90s)
 *  - Active itinerary state
 *
 * Replaces the static SAMPLE_WHISPERS list.
 */

export interface Whisper {
  id: string;
  text: string;
  time: string;
  /** What triggered this whisper — useful for analytics/debug. */
  source: 'time' | 'proximity' | 'itinerary' | 'crowd';
}

const PROXIMITY_POOL = [
  { land: 'Adventureland', text: 'The line for Pirates just dropped to 12 minutes.' },
  { land: 'Tomorrowland', text: 'Tomorrowland is breathing easy — Buzz Lightyear is a walk-on.' },
  { land: 'Liberty Square', text: "Haunted Mansion's queue music is in your favor — 18 minutes.", },
  { land: 'Fantasyland', text: 'Seven Dwarfs Mine Train just opened a back door. Take it?' },
  { land: 'Frontierland', text: 'Big Thunder is about to dispatch — you have time.' },
];

const TIME_POOL = {
  morning: [
    "The morning rope-drop is yours. Walk briskly toward Tomorrowland.",
    "Coffee is hot at Main Street Bakery. The lines come later.",
  ],
  midday: [
    "Mobile orders are stacking up. Pecos Bill's is ready in 18 minutes.",
    "Crowds are peaking. A 20-minute pause at Tom Sawyer Island would buy you afternoon energy.",
  ],
  afternoon: [
    "Festival of Fantasy steps off in 12 minutes — front of Castle.",
    "The afternoon heat is real. Tomorrowland Transit Authority has a breeze.",
  ],
  evening: [
    "The sun is softening. Photo light at the castle will peak in 20 minutes.",
    "Enchantment is at 9. Stake out the hub now if you want a clean sightline.",
  ],
} as const;

const ITINERARY_POOL = [
  "Big Thunder swapped in. New wait: 15 minutes.",
  "Splash Mountain reopened. Want to add it back?",
  "Your next reservation opens in 8 minutes. No need to rush.",
];

const getTimeBucket = (date: Date): keyof typeof TIME_POOL => {
  const h = date.getHours();
  if (h < 11) return 'morning';
  if (h < 14) return 'midday';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const formatHM = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

let _id = 0;
const nextId = () => `w${++_id}-${Date.now().toString(36)}`;

interface UseWhispersOptions {
  /** How often the simulated location/queue context rotates (ms). Default 60000. */
  rotateMs?: number;
  /** Maximum whispers kept in history. Default 6. */
  maxHistory?: number;
}

export const useWhispers = ({ rotateMs = 60_000, maxHistory = 6 }: UseWhispersOptions = {}) => {
  // Seed with one of each kind so the UI is never empty.
  const seed = useMemo<Whisper[]>(() => {
    const now = new Date();
    const bucket = getTimeBucket(now);
    const time = TIME_POOL[bucket][0];
    const proxi = PROXIMITY_POOL[Math.floor(Math.random() * PROXIMITY_POOL.length)];
    return [
      { id: nextId(), text: proxi.text, time: formatHM(now), source: 'proximity' },
      { id: nextId(), text: time, time: formatHM(now), source: 'time' },
      { id: nextId(), text: ITINERARY_POOL[0], time: formatHM(now), source: 'itinerary' },
    ];
  }, []);

  const [whispers, setWhispers] = useState<Whisper[]>(seed);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const r = Math.random();
      let next: Whisper;
      if (r < 0.45) {
        const proxi = PROXIMITY_POOL[Math.floor(Math.random() * PROXIMITY_POOL.length)];
        next = { id: nextId(), text: proxi.text, time: formatHM(now), source: 'proximity' };
      } else if (r < 0.8) {
        const bucket = getTimeBucket(now);
        const pool = TIME_POOL[bucket];
        next = { id: nextId(), text: pool[Math.floor(Math.random() * pool.length)], time: formatHM(now), source: 'time' };
      } else {
        next = {
          id: nextId(),
          text: ITINERARY_POOL[Math.floor(Math.random() * ITINERARY_POOL.length)],
          time: formatHM(now),
          source: 'itinerary',
        };
      }

      setWhispers((prev) => {
        // Avoid back-to-back duplicates.
        if (prev[0]?.text === next.text) return prev;
        return [next, ...prev].slice(0, maxHistory);
      });
    };

    const id = setInterval(tick, rotateMs);
    return () => clearInterval(id);
  }, [rotateMs, maxHistory]);

  const dismiss = (id: string) => {
    setWhispers((prev) => prev.filter((w) => w.id !== id));
  };

  return { whispers, dismiss };
};
