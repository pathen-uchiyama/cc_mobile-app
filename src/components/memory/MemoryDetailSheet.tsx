import { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Pencil, MapPin, Heart, Camera, Video, Mic, FileText, Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react';
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

// Gesture thresholds — distance OR velocity wins, so a flick works as well as a drag.
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 500;

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

  if (!memory) return null;

  const Icon = KIND_ICON[memory.kind];
  const placeTag = memory.tags.find((t) => t.kind === 'place');
  const feelingTags = memory.tags.filter((t) => t.kind === 'feeling');
  const whoTags = memory.tags.filter((t) => t.kind === 'who');

  // Sheet-level gesture handler: routes left/up/down based on dominant axis.
  const handleSheetDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y);

    if (horizontal) {
      // Swipe left to dismiss. Right swipes are ignored (no inbox-style action).
      if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
        onClose();
      }
      return;
    }

    // Vertical: up reveals, down collapses (or dismisses if already collapsed).
    if (offset.y < -SWIPE_DISTANCE || velocity.y < -SWIPE_VELOCITY) {
      setDetailsExpanded(true);
    } else if (offset.y > SWIPE_DISTANCE || velocity.y > SWIPE_VELOCITY) {
      if (detailsExpanded) {
        setDetailsExpanded(false);
      } else {
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
          >
            {/* Drag handle + gesture hint */}
            <div className="shrink-0 pt-2 pb-1 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-accent/60" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-3 shrink-0">
              <div className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold mb-2">
                {KIND_LABEL[memory.kind]}
              </div>
              <h2 className="font-display text-2xl text-foreground leading-tight line-clamp-2">
                {memory.caption}
              </h2>
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
                  {detailsExpanded ? 'Swipe down to hide' : 'Swipe up for details'}
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
