import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface CompanionState {
  /** Minimalist Mode hides everything except a single whisper + Sovereign Key. */
  minimalist: boolean;
  toggleMinimalist: () => void;
  setMinimalist: (v: boolean) => void;
}

const CompanionContext = createContext<CompanionState | null>(null);

export const CompanionProvider = ({ children }: { children: ReactNode }) => {
  const [minimalist, setMinimalist] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('companion.minimalist') === '1';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('companion.minimalist', minimalist ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [minimalist]);

  const toggleMinimalist = useCallback(() => setMinimalist((v) => !v), []);

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
    <CompanionContext.Provider value={{ minimalist, toggleMinimalist, setMinimalist }}>
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider');
  return ctx;
};
