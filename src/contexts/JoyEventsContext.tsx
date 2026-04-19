import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type JoyEventType = 'arrival' | 'snipe' | 'swap' | 'celebration' | 'check-in' | 'memory' | 'recovery';

export interface JoyEvent {
  id: string;
  type: JoyEventType;
  /** Short headline (e.g., "Space Mountain · LL Sniped") */
  title: string;
  /** Optional Library of Whispers quote rendered in italic */
  quote?: string;
  /** ISO timestamp */
  at: string;
  /** Optional minutes saved (for time-saved aggregation) */
  savedMinutes?: number;
}

interface JoyEventsState {
  events: JoyEvent[];
  log: (event: Omit<JoyEvent, 'id' | 'at'> & { at?: string }) => void;
  clear: () => void;
}

const JoyEventsContext = createContext<JoyEventsState | null>(null);

const STORAGE_KEY = 'companion.joyEvents';

const SEED: JoyEvent[] = [
  { id: 's1', type: 'arrival', title: 'Entered Magic Kingdom', quote: 'The castle approves.', at: new Date().setHours(9, 0, 0, 0).toString() },
  { id: 's2', type: 'snipe', title: 'Space Mountain · LL Sniped', quote: 'A Lightning Lane just blinked into existence. We caught it mid-blink.', at: new Date().setHours(9, 25, 0, 0).toString(), savedMinutes: 32 },
  { id: 's3', type: 'arrival', title: 'Pirates of the Caribbean', quote: "Right on time. The castle approves.", at: new Date().setHours(10, 30, 0, 0).toString() },
  { id: 's4', type: 'swap', title: 'Skipped Splash · Routed to Big Thunder', quote: 'Better wind, better wait. Your day just got 18 minutes lighter.', at: new Date().setHours(11, 10, 0, 0).toString(), savedMinutes: 18 },
  { id: 's5', type: 'memory', title: 'Photo · Castle bridge', at: new Date().setHours(11, 45, 0, 0).toString() },
  { id: 's6', type: 'check-in', title: 'Lunch · Be Our Guest', at: new Date().setHours(12, 30, 0, 0).toString() },
  { id: 's7', type: 'arrival', title: 'Haunted Mansion · Walk-on', quote: 'The mountain remembers everyone who climbs it.', at: new Date().setHours(13, 15, 0, 0).toString(), savedMinutes: 22 },
  { id: 's8', type: 'celebration', title: 'Fireworks · Enchantment', quote: 'Pure radiance.', at: new Date().setHours(20, 0, 0, 0).toString() },
];

export const JoyEventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<JoyEvent[]>(() => {
    if (typeof window === 'undefined') return SEED;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as JoyEvent[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return SEED;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch { /* ignore */ }
  }, [events]);

  const log = useCallback((e: Omit<JoyEvent, 'id' | 'at'> & { at?: string }) => {
    setEvents((prev) => [
      ...prev,
      {
        id: `e${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: e.at ?? Date.now().toString(),
        ...e,
      },
    ]);
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  return (
    <JoyEventsContext.Provider value={{ events, log, clear }}>
      {children}
    </JoyEventsContext.Provider>
  );
};

export const useJoyEvents = () => {
  const ctx = useContext(JoyEventsContext);
  if (!ctx) throw new Error('useJoyEvents must be used within JoyEventsProvider');
  return ctx;
};

/** Format an event timestamp as HH:MM. */
export const formatEventTime = (at: string) => {
  const ms = Number(at);
  const d = isNaN(ms) ? new Date(at) : new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
