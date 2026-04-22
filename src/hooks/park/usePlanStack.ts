import { useCallback, useState } from 'react';
import type { PlanItem } from '@/components/priority-stack/HeroHorizonStack';

export interface MustDo {
  id: string;
  attraction: string;
  desired: number;
  done: number;
}

interface UsePlanStackArgs {
  initialPlan: PlanItem[];
  initialMustDos: MustDo[];
  onCelebrate?: (text: string, eyebrow: string) => void;
}

/**
 * Stack state machine for the Sovereign Priority Stack.
 *
 * Owns the 3-card plan, the Must-Do tally, and every promotion / completion
 * primitive. Returning these as stable callbacks keeps `InPark` a pure
 * composition surface.
 */
export const usePlanStack = ({ initialPlan, initialMustDos, onCelebrate }: UsePlanStackArgs) => {
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);
  const [mustDos, setMustDos] = useState<MustDo[]>(initialMustDos);

  const hero = plan.find((p) => p.rank === 'now') ?? plan[0];

  const completeHero = useCallback(() => {
    if (!hero) return;
    setPlan((prev) => {
      const remaining = prev.filter((p) => p.id !== hero.id);
      if (remaining.length === 0) return remaining;
      const [first, second, ...rest] = remaining;
      return [
        { ...first, rank: 'now' as const },
        ...(second ? [{ ...second, rank: 'next' as const }] : []),
        ...rest.map((r) => ({ ...r, rank: 'later' as const })),
      ];
    });
    let toastSuffix = '';
    setMustDos((prev) =>
      prev.map((m) => {
        if (m.attraction !== hero.attraction) return m;
        const nextDone = Math.min(m.desired, m.done + 1);
        const remaining = m.desired - nextDone;
        toastSuffix =
          m.desired > 1
            ? remaining > 0
              ? ` · ${remaining} ride${remaining === 1 ? '' : 's'} to go`
              : ` · all ${m.desired} rides done`
            : '';
        return { ...m, done: nextDone };
      }),
    );
    onCelebrate?.(`${hero.attraction} — tucked into the Vault.${toastSuffix}`, 'Marked Done');
  }, [hero, onCelebrate]);

  const adjustDesired = useCallback((mustDoId: string, nextDesired: number) => {
    const clamped = Math.max(1, Math.min(10, nextDesired));
    setMustDos((prev) => prev.map((m) => (m.id === mustDoId ? { ...m, desired: clamped } : m)));
  }, []);

  const promoteToHero = useCallback((planItemId: string) => {
    setPlan((prev) => {
      const target = prev.find((p) => p.id === planItemId);
      if (!target) return prev;
      const others = prev.filter((p) => p.id !== planItemId);
      return [
        { ...target, rank: 'now' as const },
        ...others.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) })),
      ];
    });
  }, []);

  const promoteMustDoToHero = useCallback(
    (mustDoId: string, attraction: string) => {
      setPlan((prev) => {
        const existing = prev.find((p) => p.attraction === attraction);
        if (existing) {
          const others = prev.filter((p) => p.id !== existing.id);
          return [
            { ...existing, rank: 'now' as const },
            ...others.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) })),
          ];
        }
        const synthesized: PlanItem = {
          id: `must-${mustDoId}`,
          rank: 'now',
          time: 'Now',
          attraction,
          location: 'On the way',
          logic: 'Pulled from your Must-Do list — strategy is recalculating.',
          wait: '—',
          mustDo: true,
        };
        const demoted = prev.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) }));
        return [synthesized, ...demoted];
      });
      onCelebrate?.(`${attraction} promoted to your main card.`, 'Pulled In');
    },
    [onCelebrate],
  );

  return {
    plan,
    mustDos,
    hero,
    completeHero,
    promoteToHero,
    promoteMustDoToHero,
    adjustDesired,
  };
};
