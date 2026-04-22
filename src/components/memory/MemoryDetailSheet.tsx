import { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Pencil, MapPin, Heart, Camera, Video, Mic, FileText, Calendar, Clock, ChevronUp, ChevronDown, X, ArrowUp, ArrowLeft, ArrowDown } from 'lucide-react';
import { formatMemoryTime, type Memory } from '@/contexts/MemoryContext';
import TrimmedVideo from '@/components/memory/TrimmedVideo';

interface MemoryDetailSheetProps {
  open: boolean;
  onClose: () => void;
  memory: Memory | null;
  onEdit: () => void;
}

const KIND_LABEL: Record<Memory['kind'], string> = {
  photo: 'Photograph',
  video: 'Moving picture',
  voice: 'Voice memo',
  note: 'Written note',
};

const KIND_ICON: Record<Memory['kind'], typeof Camera> = {
  photo: Camera,
  video: Video,
  voice: Mic,
  note: FileText,
};

const TAG_ICON = {
  place: MapPin,
  who: Heart,
  feeling: Heart,
} as const;

const formatFullDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

const formatDuration = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

// Gesture thresholds — tuned to prevent accidental dismiss/collapse from a stray drag.
//
// Two-tier model:
//  • REVEAL  (swipe up to expand details) — easiest, low-stakes action.
//  • COLLAPSE (swipe down while expanded) — medium effort, reversible.
//  • DISMISS (swipe left, or swipe down while already collapsed) — hardest,
//    because it tears the sheet down entirely.
//
// A gesture only counts when EITHER distance ≥ threshold AND velocity ≥ a small
// floor (so a slow long drag still works), OR velocity alone is high enough to
// register as a deliberate flick. Pure tiny drags are ignored.
const REVEAL_DISTANCE = 70;     // swipe up → show details
const COLLAPSE_DISTANCE = 110;  // swipe down → hide details
const DISMISS_DISTANCE = 160;   // swipe left/down-to-close → tear down
const FLICK_VELOCITY = 700;     // velocity-only "flick" trigger
const MIN_CONFIRM_VELOCITY = 120; // must be moving, not a settle
// Axis must dominate by this ratio before we treat the gesture as horizontal
// or vertical — prevents diagonal scrolls from being misclassified.
const AXIS_DOMINANCE = 1.4;

// Once the user has successfully completed any swipe gesture on this sheet,
// we stop showing the on-screen hints. Persisted so it's a true "first run"
// affordance, not a per-open one.
const HINTS_SEEN_KEY = 'memory-detail-hints-seen-v1';

const readHintsSeen = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(HINTS_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * MemoryDetailSheet — gesture-driven playback view for a saved Vault entry.
 *
 * Gestures:
 *  - Swipe LEFT  → dismiss the sheet entirely (animates out to the left).
 *  - Swipe UP    → reveal caption + tag + metadata panel (when collapsed).
 *  - Swipe DOWN  → collapse the details panel; if already collapsed, dismiss.
 *
 * The chevron handle on the details panel is also tappable for non-gesture users.
 * Edit is a secondary action that hands off to MemoryEditorSheet.
 */
const MemoryDetailSheet = ({ open, onClose, memory, onEdit }: MemoryDetailSheetProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Lock body scroll while open + reset panel state on each open.
  useEffect(() => {
    if (!open) return;
    setDetailsExpanded(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, memory?.id]);

  // Keyboard fallback: Escape dismisses the sheet for users who can't swipe.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!memory) return null;

  const Icon = KIND_ICON[memory.kind];
  const placeTag = memory.tags.find((t) => t.kind === 'place');
  const feelingTags = memory.tags.filter((t) => t.kind === 'feeling');
  const whoTags = memory.tags.filter((t) => t.kind === 'who');

  // Sheet-level gesture handler: routes left/up/down based on dominant axis,
  // with per-action thresholds so small drags don't dismiss or collapse.
  const handleSheetDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    // Require one axis to clearly dominate; otherwise treat as a wobble and
    // let the spring snap us back to rest.
    const horizontalDominant = absX > absY * AXIS_DOMINANCE;
    const verticalDominant = absY > absX * AXIS_DOMINANCE;

    // Helper: a directional gesture passes if it's a deliberate flick OR a
    // long-enough drag that's still actively moving (not a slow settle).
    const passes = (
      offsetVal: number,
      velocityVal: number,
      distanceThreshold: number,
      direction: 1 | -1,
    ) => {
      const movedFar = direction === -1
        ? offsetVal <= -distanceThreshold
        : offsetVal >= distanceThreshold;
      const movingWithIntent = direction === -1
        ? velocityVal <= -MIN_CONFIRM_VELOCITY
        : velocityVal >= MIN_CONFIRM_VELOCITY;
      const flicked = direction === -1
        ? velocityVal <= -FLICK_VELOCITY
        : velocityVal >= FLICK_VELOCITY;
      return flicked || (movedFar && movingWithIntent);
    };

    if (horizontalDominant) {
      // Swipe left to dismiss — needs a firm, deliberate drag.
      if (passes(offset.x, velocity.x, DISMISS_DISTANCE, -1)) {
        onClose();
      }
      return;
    }

    if (!verticalDominant) {
      // Ambiguous diagonal — ignore, sheet springs back.
      return;
    }

    // Vertical: up reveals (cheap), down collapses or dismisses (expensive).
    if (passes(offset.y, velocity.y, REVEAL_DISTANCE, -1)) {
      setDetailsExpanded(true);
      return;
    }

    if (detailsExpanded) {
      // Collapse: medium threshold so accidental jitter doesn't hide details.
      if (passes(offset.y, velocity.y, COLLAPSE_DISTANCE, 1)) {
        setDetailsExpanded(false);
      }
    } else {
      // Dismiss-by-swipe-down: hardest threshold to clear.
      if (passes(offset.y, velocity.y, DISMISS_DISTANCE, 1)) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          style={{ zIndex: 'var(--z-sheet)' as unknown as number }}
        >
          {/* Vellum-blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40"
            style={{ backdropFilter: 'blur(8px) contrast(1.1) brightness(0.9)', WebkitBackdropFilter: 'blur(8px) contrast(1.1) brightness(0.9)' }}
            onClick={onClose}
          />

          {/* Sheet — drag-anywhere, routes gesture by dominant axis */}
          <motion.div
            key={memory.id}
            initial={{ x: 0, y: '100%', opacity: 1 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            drag
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={{ top: 0.25, bottom: 0.4, left: 0.3, right: 0.05 }}
            onDragEnd={handleSheetDragEnd}
            className="absolute bottom-0 inset-x-0 bg-background max-w-[480px] mx-auto rounded-t-2xl shadow-boutique-hover overflow-hidden flex flex-col"
            style={{ height: '90vh', maxHeight: '90vh', touchAction: 'none' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-detail-title"
          >
            {/* Drag handle + gesture hint */}
            <div className="shrink-0 pt-2 pb-1 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-accent/60" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-3 shrink-0 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold mb-2">
                  {KIND_LABEL[memory.kind]}
                </div>
                <h2
                  id="memory-detail-title"
                  className="font-display text-2xl text-foreground leading-tight line-clamp-2"
                >
                  {memory.caption}
                </h2>
              </div>
              {/* Accessible dismissal — always visible, keyboard reachable, 44px target */}
              <button
                type="button"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Close memory details"
                className="shrink-0 w-11 h-11 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground border-none cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col">
              {/* Media — full-bleed, sized to its medium */}
              <div className="relative rounded-2xl overflow-hidden bg-foreground mb-4">
                {memory.kind === 'photo' && (
                  <img
                    src={memory.payload}
                    alt={memory.caption}
                    className="w-full max-h-[55vh] object-contain bg-foreground pointer-events-none"
                  />
                )}
                {memory.kind === 'video' && (
                  <TrimmedVideo
                    memory={memory}
                    className="w-full max-h-[55vh] object-contain bg-foreground"
                  />
                )}
                {memory.kind === 'voice' && (
                  <div className="px-6 py-10 flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center">
                      <Mic size={32} className="text-accent" />
                    </div>
                    <audio src={memory.payload} controls className="w-full max-w-[360px]" />
                    {memory.durationMs && (
                      <span className="font-sans text-[11px] tabular-nums text-background/70">
                        {formatDuration(memory.durationMs)}
                      </span>
                    )}
                  </div>
                )}
                {memory.kind === 'note' && (
                  <div className="bg-card p-6 min-h-[200px]">
                    <p className="font-display italic text-[17px] text-foreground leading-relaxed whitespace-pre-wrap">
                      "{memory.payload}"
                    </p>
                  </div>
                )}

                {/* Kind badge */}
                <div className="absolute top-3 left-3 bg-background/85 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <Icon size={11} className="text-accent" />
                  <span className="font-sans text-[9px] uppercase tracking-sovereign text-foreground font-semibold">
                    {memory.kind}
                  </span>
                </div>
              </div>

              {/* Gesture hint pill — sits just under the media when collapsed */}
              <button
                type="button"
                onClick={() => setDetailsExpanded((v) => !v)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-expanded={detailsExpanded}
                aria-label={detailsExpanded ? 'Hide details' : 'Show details'}
                className="self-center inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted rounded-full px-3.5 py-1.5 mb-3 cursor-pointer border-none transition-colors"
              >
                {detailsExpanded ? (
                  <ChevronDown size={12} className="text-muted-foreground" />
                ) : (
                  <ChevronUp size={12} className="text-muted-foreground" />
                )}
                <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                  {detailsExpanded ? 'Tap or swipe down to hide' : 'Tap or swipe up for details'}
                </span>
              </button>

              {/* Collapsible details panel */}
              <AnimatePresence initial={false}>
                {detailsExpanded && (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                    className="overflow-hidden"
                  >
                    {/* Full caption */}
                    <section className="mb-5">
                      <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-1.5">
                        Caption
                      </span>
                      <p className="font-display italic text-[16px] text-foreground leading-relaxed">
                        "{memory.caption}"
                      </p>
                    </section>

                    {/* Place context */}
                    {placeTag && (
                      <section className="mb-5">
                        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
                          Where
                        </span>
                        <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-3.5 py-2">
                          <MapPin size={13} className="text-accent" />
                          <span className="font-sans text-[12px] text-foreground font-semibold">{placeTag.label}</span>
                        </div>
                      </section>
                    )}

                    {/* Feelings */}
                    {feelingTags.length > 0 && (
                      <section className="mb-5">
                        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
                          The feeling
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {feelingTags.map((t) => (
                            <span
                              key={t.label}
                              className="inline-flex items-center gap-1.5 bg-accent/15 border border-accent/40 rounded-full px-3 py-1.5"
                            >
                              <Heart size={11} className="text-accent" />
                              <span className="font-sans text-[11px] text-accent font-semibold">{t.label}</span>
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Who */}
                    {whoTags.length > 0 && (
                      <section className="mb-5">
                        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
                          Who was there
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {whoTags.map((t) => {
                            const TagIcon = TAG_ICON[t.kind];
                            return (
                              <span
                                key={t.label}
                                className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5"
                              >
                                <TagIcon size={11} className="text-muted-foreground" />
                                <span className="font-sans text-[11px] text-foreground">{t.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Metadata strip */}
                    <section className="bg-card rounded-2xl p-4 shadow-boutique flex items-center gap-5 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-muted-foreground" />
                        <div>
                          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground block">Date</span>
                          <span className="font-sans text-[12px] text-foreground">{formatFullDate(memory.at)}</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-muted-foreground" />
                        <div>
                          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground block">Time</span>
                          <span className="font-sans text-[12px] text-foreground tabular-nums">{formatMemoryTime(memory.at)}</span>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions — pinned to bottom so they're reachable in either state */}
            <div className="shrink-0 px-6 pt-3 pb-6 border-t border-border bg-background flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-muted-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <Pencil size={13} />
                Edit memory
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemoryDetailSheet;
