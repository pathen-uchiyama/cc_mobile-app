import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type ServiceTier = 'explorer' | 'manager' | 'sovereign';

interface CompanionState {
  /** Minimalist Mode hides everything except a single whisper + Sovereign Key. */
  minimalist: boolean;
  toggleMinimalist: () => void;
  setMinimalist: (v: boolean) => void;

  /** Service tier — gates AI features. */
  tier: ServiceTier;
  setTier: (t: ServiceTier) => void;

  /** Whether the Lightning Lane tracker is visible in the in-park view. */
  llTrackerVisible: boolean;
  setLlTrackerVisible: (v: boolean) => void;

  /** Haptics on / off. */
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => void;

  /** Whimsical celebrations on / off. */
  celebrationsEnabled: boolean;
  setCelebrationsEnabled: (v: boolean) => void;

  /** Dev panel (snipe simulator) visibility. */
  devPanelEnabled: boolean;
  setDevPanelEnabled: (v: boolean) => void;
}

const CompanionContext = createContext<CompanionState | null>(null);

const readBool = (key: string, fallback: boolean) => {
  if (typeof window === 'undefined') return fallback;
  const v = window.localStorage.getItem(key);
  if (v === null) return fallback;
  return v === '1';
};

const readStr = <T extends string>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  return (window.localStorage.getItem(key) as T) || fallback;
};

export const CompanionProvider = ({ children }: { children: ReactNode }) => {
  const [minimalist, setMinimalist] = useState<boolean>(() => readBool('companion.minimalist', false));
  const [tier, setTierState] = useState<ServiceTier>(() => readStr<ServiceTier>('companion.tier', 'manager'));
  const [llTrackerVisible, setLlTrackerVisibleState] = useState<boolean>(() => readBool('companion.llTracker', true));
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => readBool('companion.haptics', true));
  const [celebrationsEnabled, setCelebrationsEnabledState] = useState<boolean>(() => readBool('companion.celebrations', true));
  const [devPanelEnabled, setDevPanelEnabledState] = useState<boolean>(() => readBool('companion.devPanel', false));

  const persist = (key: string, value: string) => {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  };

  useEffect(() => persist('companion.minimalist', minimalist ? '1' : '0'), [minimalist]);
  useEffect(() => persist('companion.tier', tier), [tier]);
  useEffect(() => persist('companion.llTracker', llTrackerVisible ? '1' : '0'), [llTrackerVisible]);
  useEffect(() => persist('companion.haptics', hapticsEnabled ? '1' : '0'), [hapticsEnabled]);
  useEffect(() => persist('companion.celebrations', celebrationsEnabled ? '1' : '0'), [celebrationsEnabled]);
  useEffect(() => persist('companion.devPanel', devPanelEnabled ? '1' : '0'), [devPanelEnabled]);

  const toggleMinimalist = useCallback(() => setMinimalist((v) => !v), []);
  const setTier = useCallback((t: ServiceTier) => setTierState(t), []);
  const setLlTrackerVisible = useCallback((v: boolean) => setLlTrackerVisibleState(v), []);
  const setHapticsEnabled = useCallback((v: boolean) => setHapticsEnabledState(v), []);
  const setCelebrationsEnabled = useCallback((v: boolean) => setCelebrationsEnabledState(v), []);
  const setDevPanelEnabled = useCallback((v: boolean) => setDevPanelEnabledState(v), []);

  // Two-finger swipe-down anywhere toggles Minimalist Mode.
  useEffect(() => {
    let startY: number | null = null;
    let startTouches = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startTouches = 2;
        startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else {
        startTouches = e.touches.length;
        startY = null;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startTouches === 2 && startY !== null && e.changedTouches.length >= 2) {
        const endY = (e.changedTouches[0].clientY + e.changedTouches[1].clientY) / 2;
        if (endY - startY > 80) {
          setMinimalist((v) => !v);
        }
      }
      startY = null;
      startTouches = 0;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <CompanionContext.Provider
      value={{
        minimalist, toggleMinimalist, setMinimalist,
        tier, setTier,
        llTrackerVisible, setLlTrackerVisible,
        hapticsEnabled, setHapticsEnabled,
        celebrationsEnabled, setCelebrationsEnabled,
        devPanelEnabled, setDevPanelEnabled,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider');
  return ctx;
};
