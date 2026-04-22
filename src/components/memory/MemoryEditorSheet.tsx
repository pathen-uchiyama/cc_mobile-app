import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check, Loader2, AlertTriangle, X, Camera, Video, Mic, FileText } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { useMemoryVault, formatMemoryTime, type Memory, type MemoryTag } from '@/contexts/MemoryContext';
import { useCelebrate } from '@/contexts/CelebrationContext';
import TrimmedVideo from '@/components/memory/TrimmedVideo';

interface MemoryEditorSheetProps {
  open: boolean;
  onClose: () => void;
  memory: Memory | null;
}

const FEELINGS = ['Joyful', 'Awestruck', 'Cozy', 'Hilarious', 'Quiet', 'Proud'];

const KIND_ICON: Record<Memory['kind'], typeof Camera> = {
  photo: Camera,
  video: Video,
  voice: Mic,
  note: FileText,
};

/**
 * MemoryEditorSheet — review, retitle, retag or delete a saved memory.
 * The original payload (photo/video/voice/note body) is immutable; only
 * caption + tags are editable. Deletion requires an explicit confirm.
 */
const MemoryEditorSheet = ({ open, onClose, memory }: MemoryEditorSheetProps) => {
  const { updateMemory, deleteMemory } = useMemoryVault();
  const { celebrate } = useCelebrate();

  const [caption, setCaption] = useState('');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [placeTag, setPlaceTag] = useState<MemoryTag | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  // Hydrate form whenever a new memory is opened
  useEffect(() => {
    if (!memory) return;
    setCaption(memory.caption);
    setFeelings(memory.tags.filter((t) => t.kind === 'feeling').map((t) => t.label));
    setPlaceTag(memory.tags.find((t) => t.kind === 'place') ?? null);
    setConfirmDelete(false);
    setBusy(false);
  }, [memory?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!memory) return null;
  const Icon = KIND_ICON[memory.kind];

  const toggleFeeling = (f: string) =>
    setFeelings((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const dirty =
    caption.trim() !== memory.caption.trim() ||
    feelings.sort().join('|') !== memory.tags.filter((t) => t.kind === 'feeling').map((t) => t.label).sort().join('|');

  const handleSave = () => {
    if (!caption.trim()) return;
    setBusy(true);
    const tags: MemoryTag[] = [];
    if (placeTag) tags.push(placeTag);
    feelings.forEach((f) => tags.push({ label: f, kind: 'feeling' }));
    updateMemory(memory.id, { caption: caption.trim(), tags });
    celebrate('Memory updated.', 'Saved');
    setBusy(false);
    onClose();
  };

  const handleDelete = () => {
    setBusy(true);
    deleteMemory(memory.id);
    celebrate('Memory removed from the Vault.', 'Deleted');
    setBusy(false);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snap="full"
      eyebrow={confirmDelete ? 'Are you sure?' : 'Edit memory'}
      title={confirmDelete ? 'Remove from the Vault' : 'Refine this moment'}
      subtitle={!confirmDelete ? `Captured ${formatMemoryTime(memory.at)}` : undefined}
    >
      <AnimatePresence mode="wait">
        {!confirmDelete ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Read-only payload preview */}
            <div className="relative rounded-2xl overflow-hidden bg-foreground mb-5">
              {memory.kind === 'photo' && (
                <img src={memory.payload} alt={memory.caption} className="w-full aspect-[4/5] object-cover" />
              )}
              {memory.kind === 'video' && (
                <TrimmedVideo memory={memory} className="w-full aspect-[4/5] object-cover" />
              )}
              {memory.kind === 'voice' && (
                <div className="aspect-[4/2] flex items-center justify-center p-6">
                  <audio src={memory.payload} controls className="w-full" />
                </div>
              )}
              {memory.kind === 'note' && (
                <div className="bg-card p-5 min-h-[160px]">
                  <p className="font-display italic text-[15px] text-foreground leading-relaxed">
                    "{memory.payload}"
                  </p>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-background/85 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                <Icon size={11} className="text-accent" />
                <span className="font-sans text-[9px] uppercase tracking-sovereign text-foreground font-semibold">
                  {memory.kind}
                </span>
              </div>
            </div>

            {/* Caption */}
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold block mb-2">
              Caption
            </span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What is this memory?"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 font-display italic text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />

            {/* Place chip (read-only context) */}
            {placeTag && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5">
                <span className="font-sans text-[10px] text-muted-foreground uppercase tracking-sovereign">
                  At
                </span>
                <span className="font-sans text-[11px] text-foreground font-semibold">{placeTag.label}</span>
              </div>
            )}

            {/* Feelings */}
            <div className="mt-5">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
                The feeling
              </span>
              <div className="flex flex-wrap gap-2">
                {FEELINGS.map((f) => {
                  const active = feelings.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFeeling(f)}
                      className={`px-3 py-1.5 rounded-full font-sans text-[11px] cursor-pointer border transition-colors ${
                        active
                          ? 'bg-accent/15 border-accent/50 text-accent font-semibold'
                          : 'bg-transparent border-border text-muted-foreground'
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action row */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                aria-label="Delete memory"
                className="w-12 h-12 rounded-2xl bg-transparent border border-destructive/40 text-destructive flex items-center justify-center cursor-pointer disabled:opacity-40 hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-muted-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!caption.trim() || !dirty || busy}
                className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save changes
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col"
          >
            <div className="bg-card rounded-2xl p-6 shadow-boutique flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/12 flex items-center justify-center mb-4">
                <AlertTriangle size={26} className="text-destructive" />
              </div>
              <h3 className="font-display text-[18px] text-foreground leading-tight mb-2">
                Remove this memory?
              </h3>
              <p className="font-sans text-[12px] text-muted-foreground leading-relaxed max-w-[30ch]">
                "{memory.caption}" will be erased from the Vault. This can't be undone — the moment lives only on this device.
              </p>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer flex items-center justify-center gap-2"
              >
                <X size={14} />
                Keep it
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 py-3.5 rounded-2xl bg-destructive text-destructive-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
};

export default MemoryEditorSheet;
