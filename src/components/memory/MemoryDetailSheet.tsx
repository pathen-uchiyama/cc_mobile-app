import { motion } from 'framer-motion';
import { Pencil, MapPin, Heart, Camera, Video, Mic, FileText, Calendar, Clock } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
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

/**
 * MemoryDetailSheet — read-only playback view for a saved Vault entry.
 *
 * Shows the media at native fidelity (full-bleed photo/video, large player for
 * voice, full text for notes), the complete caption, place context, and every
 * tag chip. Edit is a secondary action that hands off to MemoryEditorSheet.
 */
const MemoryDetailSheet = ({ open, onClose, memory, onEdit }: MemoryDetailSheetProps) => {
  if (!memory) return null;

  const Icon = KIND_ICON[memory.kind];
  const placeTag = memory.tags.find((t) => t.kind === 'place');
  const feelingTags = memory.tags.filter((t) => t.kind === 'feeling');
  const whoTags = memory.tags.filter((t) => t.kind === 'who');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snap="full"
      eyebrow={KIND_LABEL[memory.kind]}
      title={memory.caption}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        {/* Media — full-bleed, sized to its medium */}
        <div className="relative rounded-2xl overflow-hidden bg-foreground mb-5">
          {memory.kind === 'photo' && (
            <img
              src={memory.payload}
              alt={memory.caption}
              className="w-full max-h-[70vh] object-contain bg-foreground"
            />
          )}
          {memory.kind === 'video' && (
            <TrimmedVideo
              memory={memory}
              className="w-full max-h-[70vh] object-contain bg-foreground"
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

        {/* Full caption (re-stated; the sheet title may truncate on long lines) */}
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
        <section className="bg-card rounded-2xl p-4 shadow-boutique flex items-center gap-5 mb-6">
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

        {/* Actions */}
        <div className="flex gap-3">
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
    </BottomSheet>
  );
};

export default MemoryDetailSheet;
