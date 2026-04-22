import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, Mic, FileText, Square, Check, Upload, X, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { useMediaCapture, type CaptureMode } from '@/hooks/memory/useMediaCapture';
import { useMemoryVault, type MemoryKind, type MemoryTag } from '@/contexts/MemoryContext';
import { useCelebrate } from '@/contexts/CelebrationContext';

interface RecordMemorySheetProps {
  open: boolean;
  onClose: () => void;
  /** Optional preset context — e.g. the current Hero attraction */
  contextHint?: { attraction?: string; location?: string };
}

type Step = 'pick' | 'capture' | 'review' | 'caption' | 'note';

const MODES: { id: CaptureMode | 'note'; label: string; icon: typeof Camera; hint: string }[] = [
  { id: 'photo', label: 'Photo', icon: Camera, hint: 'A single still moment.' },
  { id: 'video', label: 'Video', icon: Video, hint: 'Up to 10 seconds.' },
  { id: 'voice', label: 'Voice memo', icon: Mic, hint: 'Up to 1 minute.' },
  { id: 'note', label: 'Note', icon: FileText, hint: 'A typed thought.' },
];

const FEELINGS = ['Joyful', 'Awestruck', 'Cozy', 'Hilarious', 'Quiet', 'Proud'];

const formatMs = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const RecordMemorySheet = ({ open, onClose, contextHint }: RecordMemorySheetProps) => {
  const { saveMemory } = useMemoryVault();
  const { celebrate } = useCelebrate();

  const [step, setStep] = useState<Step>('pick');
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [captured, setCaptured] = useState<{ kind: MemoryKind; payload: string; mime?: string; durationMs?: number } | null>(null);
  const [caption, setCaption] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capture = useMediaCapture(mode);

  // Reset on close
  useEffect(() => {
    if (!open) {
      capture.stop();
      setStep('pick');
      setCaptured(null);
      setCaption('');
      setNoteBody('');
      setSelectedFeelings([]);
      setBusy(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bind stream to <video>
  useEffect(() => {
    if (videoRef.current && capture.stream) {
      videoRef.current.srcObject = capture.stream;
      videoRef.current.play().catch(() => {/* ignore autoplay blocks */});
    }
  }, [capture.stream]);

  const choose = async (id: CaptureMode | 'note') => {
    if (id === 'note') {
      setStep('note');
      return;
    }
    setMode(id);
    setStep('capture');
    await capture.start();
  };

  const handlePhotoCapture = async () => {
    if (!videoRef.current) return;
    try {
      const result = await capture.capturePhoto(videoRef.current);
      setCaptured({ kind: 'photo', payload: result.dataUrl, mime: result.mime });
      setStep('review');
    } catch {
      // ignore — user can retry
    }
  };

  const handleStartRecording = async () => {
    if (!capture.stream) return;
    try {
      const result = await capture.startRecording(capture.stream);
      setCaptured({
        kind: mode === 'voice' ? 'voice' : 'video',
        payload: result.dataUrl,
        mime: result.mime,
        durationMs: result.durationMs,
      });
      setStep('review');
    } catch {
      // ignore
    }
  };

  const handleStopRecording = () => capture.stop();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const kind: MemoryKind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : 'photo';
      setMode(kind === 'voice' ? 'voice' : kind === 'video' ? 'video' : 'photo');
      setCaptured({ kind, payload: dataUrl, mime: file.type });
      capture.stop();
      setStep('review');
    };
    reader.readAsDataURL(file);
  };

  const toggleFeeling = (f: string) => {
    setSelectedFeelings((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleSaveNote = () => {
    if (!noteBody.trim()) return;
    setBusy(true);
    const tags: MemoryTag[] = [];
    if (contextHint?.attraction) tags.push({ label: contextHint.attraction, kind: 'place' });
    selectedFeelings.forEach((f) => tags.push({ label: f, kind: 'feeling' }));
    saveMemory({ kind: 'note', payload: noteBody.trim(), caption: caption.trim() || 'A quiet thought.', tags });
    celebrate('Memory tucked into the Vault.', 'Saved');
    setBusy(false);
    onClose();
  };

  const handleSaveMedia = () => {
    if (!captured) return;
    setBusy(true);
    const tags: MemoryTag[] = [];
    if (contextHint?.attraction) tags.push({ label: contextHint.attraction, kind: 'place' });
    selectedFeelings.forEach((f) => tags.push({ label: f, kind: 'feeling' }));
    saveMemory({
      kind: captured.kind,
      payload: captured.payload,
      mime: captured.mime,
      durationMs: captured.durationMs,
      caption: caption.trim() || `A ${captured.kind} memory.`,
      tags,
    });
    celebrate('Memory tucked into the Vault.', 'Saved');
    setBusy(false);
    onClose();
  };

  const ctxLine = contextHint?.attraction
    ? `At ${contextHint.attraction}${contextHint.location ? ` · ${contextHint.location}` : ''}`
    : 'A moment, preserved.';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snap="full"
      eyebrow={step === 'pick' ? 'The Vault' : step === 'review' || step === 'caption' ? 'Tell us about it' : 'Recording'}
      title={
        step === 'pick' ? 'Record a Memory' :
        step === 'note' ? 'A typed thought' :
        step === 'capture' ? `Capture ${mode === 'voice' ? 'voice' : mode}` :
        'Caption & context'
      }
      subtitle={step === 'pick' ? ctxLine : undefined}
    >
      <AnimatePresence mode="wait">
        {/* ─────────────────────────────────── STEP 1: PICK MODE */}
        {step === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-3"
          >
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choose(m.id)}
                  className="bg-card rounded-2xl p-5 shadow-boutique flex flex-col items-start gap-2 border-none cursor-pointer text-left min-h-[120px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <span className="font-display text-base text-foreground leading-tight">{m.label}</span>
                  <span className="font-sans text-[11px] text-muted-foreground leading-snug">{m.hint}</span>
                </motion.button>
              );
            })}

            {/* Library upload fallback */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="col-span-2 mt-2 bg-transparent border border-dashed border-border rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload size={14} />
              <span className="font-sans text-[11px] uppercase tracking-sovereign">Upload from library</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              hidden
              onChange={handleFileUpload}
            />
          </motion.div>
        )}

        {/* ─────────────────────────────────── STEP 2A: CAPTURE (camera/voice) */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {capture.error && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-4 text-[12px] font-sans">
                {capture.error}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="block mt-2 underline cursor-pointer bg-transparent border-none text-destructive font-sans text-[11px]"
                >
                  Upload from library instead
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  hidden
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Live preview */}
            {mode !== 'voice' ? (
              <div className="relative bg-foreground rounded-2xl overflow-hidden aspect-[4/5] mb-5">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {capture.isRecording && (
                  <div className="absolute top-3 left-3 bg-destructive/90 text-destructive-foreground px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-2 rounded-full bg-destructive-foreground"
                    />
                    <span className="font-sans text-[11px] tabular-nums font-semibold">{formatMs(capture.durationMs)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative bg-foreground rounded-2xl aspect-[4/5] mb-5 flex flex-col items-center justify-center">
                <motion.div
                  animate={capture.isRecording ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-4"
                >
                  <Mic size={32} className="text-accent" />
                </motion.div>
                <p className="font-display italic text-[15px] text-background">
                  {capture.isRecording ? 'Listening…' : 'Tap to begin recording'}
                </p>
                {capture.isRecording && (
                  <span className="font-sans text-[12px] tabular-nums text-background/70 mt-2">
                    {formatMs(capture.durationMs)} · max {formatMs(capture.maxRecordingMs)}
                  </span>
                )}
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => { capture.stop(); setStep('pick'); }}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer"
                aria-label="Cancel"
              >
                <X size={18} className="text-muted-foreground" />
              </button>

              {mode === 'photo' ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handlePhotoCapture}
                  disabled={!capture.stream}
                  className="w-20 h-20 rounded-full bg-primary border-4 border-card shadow-boutique-hover flex items-center justify-center cursor-pointer disabled:opacity-50"
                  aria-label="Take photo"
                >
                  <div className="w-14 h-14 rounded-full bg-primary-foreground/20" />
                </motion.button>
              ) : capture.isRecording ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleStopRecording}
                  className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center cursor-pointer border-4 border-card shadow-boutique-hover"
                  aria-label="Stop recording"
                >
                  <Square size={24} className="text-destructive-foreground" fill="currentColor" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleStartRecording}
                  disabled={!capture.stream}
                  className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center cursor-pointer border-4 border-card shadow-boutique-hover disabled:opacity-50"
                  aria-label="Start recording"
                >
                  {mode === 'voice' ? <Mic size={26} className="text-destructive-foreground" /> : <Video size={26} className="text-destructive-foreground" />}
                </motion.button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer"
                aria-label="Upload from library"
              >
                <Upload size={18} className="text-muted-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                hidden
                onChange={handleFileUpload}
              />
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────── STEP 2B: NOTE */}
        {step === 'note' && (
          <motion.div
            key="note"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <textarea
              autoFocus
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="What just happened? What did it feel like?"
              rows={6}
              className="w-full bg-card border border-border rounded-2xl p-4 font-display italic text-[15px] text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />

            <div className="mt-4">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
                One-line title (optional)
              </span>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Castle bridge at golden hour"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 font-sans text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <FeelingPicker selected={selectedFeelings} onToggle={toggleFeeling} />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('pick')}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-muted-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteBody.trim() || busy}
                className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save to Vault
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────── STEP 3: REVIEW + CAPTION */}
        {step === 'review' && captured && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Preview */}
            <div className="rounded-2xl overflow-hidden mb-4 bg-foreground">
              {captured.kind === 'photo' && (
                <img src={captured.payload} alt="Captured" className="w-full aspect-[4/5] object-cover" />
              )}
              {captured.kind === 'video' && (
                <video src={captured.payload} controls playsInline className="w-full aspect-[4/5] object-cover bg-foreground" />
              )}
              {captured.kind === 'voice' && (
                <div className="aspect-[4/2] flex items-center justify-center p-6">
                  <audio src={captured.payload} controls className="w-full" />
                </div>
              )}
            </div>

            {/* The "what is this?" prompt — drives the caption */}
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold block mb-2">
              What is this memory?
            </span>
            <input
              type="text"
              autoFocus
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={contextHint?.attraction ? `e.g. The view from ${contextHint.attraction}` : 'e.g. The castle at golden hour'}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 font-display italic text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />

            <FeelingPicker selected={selectedFeelings} onToggle={toggleFeeling} />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCaptured(null); setStep('pick'); }}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-muted-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer"
              >
                Retake
              </button>
              <button
                onClick={handleSaveMedia}
                disabled={busy}
                className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save to Vault
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
};

const FeelingPicker = ({ selected, onToggle }: { selected: string[]; onToggle: (f: string) => void }) => (
  <div className="mt-5">
    <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold block mb-2">
      The feeling
    </span>
    <div className="flex flex-wrap gap-2">
      {FEELINGS.map((f) => {
        const active = selected.includes(f);
        return (
          <button
            key={f}
            onClick={() => onToggle(f)}
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
);

export default RecordMemorySheet;
