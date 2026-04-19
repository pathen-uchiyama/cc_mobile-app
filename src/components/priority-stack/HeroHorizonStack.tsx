import { motion } from 'framer-motion';
import FocusMove from './FocusMove';
import HorizonCard from './HorizonCard';

export interface PlanItem {
  id: string;
  rank: 'now' | 'next' | 'later';
  time: string;
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  /** Party poll result: how many of the traveling party flagged this as a must-do. */
  party?: { yes: number; total: number };
  /** Keepsake prompt — surfaces in the Memory Ribbon of the card. */
  questPrompt?: string;
  questType?: 'photo' | 'voice';
  /** When true, this attraction is one of the user's day-of Must-Dos — gold border. */
  mustDo?: boolean;
}

/**
 * Walking prompts are intentionally NOT rendered in the stack.
 * Hard cap: the /park page renders at most 3 cards at any time.
 * Walking whimsy surfaces as ambient toasts/whispers, never as a 4th card.
 */
export interface WalkingPrompt {
  id: string;
  afterIndex: 0 | 1 | 2;
  whimsy: string;
  type?: 'photo' | 'voice' | 'observe';
  nearby?: string;
}

interface HeroHorizonStackProps {
  items: PlanItem[];
  /** Kept for API compatibility — currently ignored to enforce the 3-card cap. */
  walkingPrompts?: WalkingPrompt[];
  onCommitHero: () => void;
  onCaptureMemory?: (planItemId: string) => void;
  /** Kept for API compatibility — walking cards are no longer rendered. */
  onCaptureWalking?: (walkingId: string) => void;
  onFindAndSeek?: (planItemId: string) => void;
  /** When true, the Hero card glows gold + shows "A New Path is Available". */
  pivotSuggested?: boolean;
  pivotHeadline?: string;
}

/**
 * The Sovereign Priority Stack — the ONLY plan surface.
 *
 * Hard contract: never more than 3 cards on screen.
 *   • Priority 1 — The Hero. Top 50% of viewport. Heavy Boutique Shadow.
 *   • Priority 2 & 3 — The Horizon. ~20% smaller height, slightly offset.
 *
 * Every card carries the Engagement Ribbon (54px, Record Memory + Find & Seek).
 * Must-Do attractions get a Burnished Gold border.
 *
 * No walking cards. No "Full Ledger". No overflow. The 4th+ items live in
 * the Sovereign Key's Audible drawer ("Reset Strategy"), not this surface.
 */
const HeroHorizonStack = ({
  items,
  onCommitHero,
  onCaptureMemory,
  onFindAndSeek,
  pivotSuggested = false,
  pivotHeadline,
}: HeroHorizonStackProps) => {
  const hero = items.find((i) => i.rank === 'now') ?? items[0];
  if (!hero) return null;
  // Only the next 2 items beyond the hero — hard cap.
  const horizon = items.filter((i) => i.id !== hero.id).slice(0, 2);

  return (
    <div className="flex flex-col">
      {/* Forced-Focus eyebrow */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign font-bold"
          style={{ color: 'hsl(var(--gold))' }}
        >
          The Sovereign Stack
        </span>
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          Three. No more.
        </span>
      </div>

      {/* Priority 1 — The Hero. Top 50% of viewport. */}
      <div
        className="relative"
        style={{ height: '50vh', minHeight: '420px', marginBottom: '12px' }}
      >
        <FocusMove
          attraction={hero.attraction}
          location={hero.location}
          logic={hero.logic}
          wait={hero.wait}
          party={hero.party}
          ctaLabel="On Our Way"
          onCommit={onCommitHero}
          questPrompt={hero.questPrompt}
          questType={hero.questType}
          onCaptureMemory={() => onCaptureMemory?.(hero.id)}
          onFindAndSeek={() => onFindAndSeek?.(hero.id)}
          pivotSuggested={pivotSuggested}
          pivotHeadline={pivotHeadline}
          mustDo={hero.mustDo}
        />
      </div>

      {/* Priority 2 & 3 — The Horizon. 20% smaller, slightly offset inward
          to telegraph "near future" depth without scaling (which would shrink
          touch targets and break the Engagement Ribbon's 54px contract). */}
      {horizon.length > 0 && (
        <div className="relative space-y-2.5">
          {horizon.map((it, idx) => (
            <motion.div
              key={it.id}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.08 + idx * 0.08 }}
              style={{
                // Slightly offset inward — second further than first.
                width: idx === 0 ? '94%' : '88%',
                margin: '0 auto',
              }}
            >
              <HorizonCard
                rank={it.rank as 'next' | 'later'}
                time={it.time}
                attraction={it.attraction}
                location={it.location}
                logic={it.logic}
                wait={it.wait}
                llSecured={it.llSecured}
                depth={(idx + 1) as 1 | 2}
                party={it.party}
                mustDo={it.mustDo}
                onCaptureMemory={() => onCaptureMemory?.(it.id)}
                onFindAndSeek={() => onFindAndSeek?.(it.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroHorizonStack;
