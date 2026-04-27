import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import FocusMove from './FocusMove';

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

export interface WalkingPrompt {
  id: string;
  afterIndex: 0 | 1 | 2;
  whimsy: string;
  type?: 'photo' | 'voice' | 'observe';
  nearby?: string;
}

interface HeroHorizonStackProps {
  items: PlanItem[];
  walkingPrompts?: WalkingPrompt[];
  onCommitHero: () => void;
  onCaptureMemory?: (planItemId: string) => void;
  onCaptureWalking?: (walkingId: string) => void;
  onFindAndSeek?: (planItemId: string) => void;
  /** Promote a Horizon card to the Hero slot — drives the swap animation. */
  onPromote?: (planItemId: string) => void;
  /** Mark the Hero as completed/seen — removes it from the stack. */
  onCompleteHero?: () => void;
  pivotSuggested?: boolean;
  pivotHeadline?: string;
  /** Pass-through: imminent dining/experience hold for the "On the Books" chip. */
  upcomingHold?: {
    kind: 'dining' | 'experience';
    name: string;
    minutesAway: number;
    walkMinutes?: number;
  };
  onUpcomingHoldTap?: () => void;
  llCapacity?: {
    canBookNow: boolean;
    unlocksInMin: number;
    held: number;
    cap: number;
  };
  onLLChipTap?: () => void;
}

/**
 * The Sovereign Priority Stack — the ONLY plan surface.
 *
 * Hard contract: never more than 3 cards on screen.
 *   • Priority 1 — The Hero. Heavy Boutique Shadow.
 *   • Priority 2 & 3 — The Horizon. ~20% smaller, slightly offset.
 *
 * Tapping a Horizon card promotes it to the Hero slot via a shared-layout
 * swap (framer-motion LayoutGroup). The Hero exposes a "Mark complete"
 * close affordance that removes it and pulls the next item up.
 */
const HeroHorizonStack = ({
  items,
  onCommitHero,
  onCaptureMemory,
  onFindAndSeek,
  onPromote,
  onCompleteHero,
  pivotSuggested = false,
  pivotHeadline,
  upcomingHold,
  onUpcomingHoldTap,
  llCapacity,
  onLLChipTap,
}: HeroHorizonStackProps) => {
  const hero = items.find((i) => i.rank === 'now') ?? items[0];
  if (!hero) return null;

  return (
    <div className="flex flex-col">
      <LayoutGroup id="sovereign-stack">
        {/* Hero slot — keyed by id so framer-motion morphs it on swap */}
        <div className="relative" style={{ marginBottom: '14px' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={hero.id}
              layout
              layoutId={`plan-${hero.id}`}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: -40, rotate: -2 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            >
              <FocusMove
                attraction={hero.attraction}
                location={hero.location}
                logic={hero.logic}
                wait={hero.wait}
                party={hero.party}
                ctaLabel="On Our Way"
                onCommit={onCommitHero}
                onComplete={onCompleteHero}
                questPrompt={hero.questPrompt}
                questType={hero.questType}
                onCaptureMemory={() => onCaptureMemory?.(hero.id)}
                onFindAndSeek={() => onFindAndSeek?.(hero.id)}
                pivotSuggested={pivotSuggested}
                pivotHeadline={pivotHeadline}
                mustDo={hero.mustDo}
                upcomingHold={upcomingHold}
                onUpcomingHoldTap={onUpcomingHoldTap}
                llCapacity={llCapacity}
                onLLChipTap={onLLChipTap}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
};

export default HeroHorizonStack;
