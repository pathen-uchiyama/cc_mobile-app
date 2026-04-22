import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, Mic, FileText, Square, Check, Upload, X, Loader2, ShieldCheck, AlertCircle, Settings, Sunrise, Moon } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { useMediaCapture, type CaptureMode } from '@/hooks/memory/useMediaCapture';
import { useMemoryVault, type MemoryKind, type MemoryTag, type InterviewPhase } from '@/contexts/MemoryContext';
import { useCelebrate } from '@/contexts/CelebrationContext';
import VideoTrimmer from '@/components/memory/VideoTrimmer';
import InterviewSheet from '@/components/memory/InterviewSheet';

interface RecordMemorySheetProps {
  open: boolean;
  onClose: () => void;
  /** Optional preset context — e.g. the current Hero attraction */
  contextHint?: { attraction?: string; location?: string };
}

type Step = 'pick' | 'permission' | 'capture' | 'review' | 'caption' | 'note';

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
  // Trim window for video memories — seconds, relative to the source clip.
  // Defaults to the full clip; user confirms (or shortens) before saving.
  const [trim, setTrim] = useState<{ start: number; end: number } | null>(null);
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
      setTrim(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bind stream to <video>
  useEffect(() => {
    if (videoRef.current && capture.stream) {
      videoRef.current.srcObject = capture.stream;
      videoRef.current.play().catch(() => {/* ignore autoplay blocks */});
    }
  }, [capture.stream]);

  const choose = (id: CaptureMode | 'note') => {
    if (id === 'note') {
      setStep('note');
      return;
    }
    setMode(id);
    // Always prime first — we never call getUserMedia without an explicit user gesture
    // on the priming screen, so the OS prompt feels expected, not abrupt.
    setStep('permission');
  };

  const requestAccess = async () => {
    const stream = await capture.start();
    if (stream) setStep('capture');
    // If denied / unsupported, we stay on the 'permission' step and the UI swaps
    // to a denial state driven by `capture.permission`.
  };

  const openLibrary = () => fileInputRef.current?.click();

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
    // Reset so picking the same file twice still triggers onChange
    e.target.value = '';
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
    // For video, fold the chosen trim window into the saved metadata so
    // playback respects it everywhere (Detail sheet, Editor, Joy Report).
    const isVideo = captured.kind === 'video';
    const trimmedDurationMs =
      isVideo && trim ? Math.round((trim.end - trim.start) * 1000) : captured.durationMs;
    saveMemory({
      kind: captured.kind,
      payload: captured.payload,
      mime: captured.mime,
      durationMs: trimmedDurationMs,
      trimStart: isVideo && trim ? trim.start : undefined,
      trimEnd: isVideo && trim ? trim.end : undefined,
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
      eyebrow={
        step === 'pick' ? 'The Vault' :
        step === 'permission' ? 'One quick ask' :
        step === 'review' || step === 'caption' ? 'Tell us about it' :
        'Recording'
      }
      title={
        step === 'pick' ? 'Record a Memory' :
        step === 'note' ? 'A typed thought' :
        step === 'permission' ? (
          capture.permission === 'denied' ? 'Access blocked' :
          capture.permission === 'unsupported' ? 'Capture unavailable' :
          mode === 'voice' ? 'Microphone access' : 'Camera access'
        ) :
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

        {/* ─────────────────────────────────── STEP 1.5: PERMISSION PRIMING / DENIAL */}
        {step === 'permission' && (
          <motion.div
            key="permission"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col"
          >
            <PermissionPanel
              mode={mode}
              status={capture.permission}
              error={capture.error}
              busy={capture.permission === 'prompting'}
              onRequest={requestAccess}
              onUpload={openLibrary}
              onBack={() => { capture.stop(); setStep('pick'); }}
            />
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
            {/* Inline soft-error if device dropped mid-session (rare) */}
            {capture.error && capture.permission === 'granted' && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-3 mb-4 text-[12px] font-sans flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{capture.error}</span>
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
            {captured.kind === 'video' ? (
              <div className="mb-4">
                <VideoTrimmer
                  src={captured.payload}
                  initialDurationSec={(captured.durationMs ?? 0) / 1000}
                  maxLengthSec={10}
                  minLengthSec={1}
                  onChange={(start, end) => setTrim({ start, end })}
                />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden mb-4 bg-foreground">
                {captured.kind === 'photo' && (
                  <img src={captured.payload} alt="Captured" className="w-full aspect-[4/5] object-cover" />
                )}
                {captured.kind === 'voice' && (
                  <div className="aspect-[4/2] flex items-center justify-center p-6">
                    <audio src={captured.payload} controls className="w-full" />
                  </div>
                )}
              </div>
            )}

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

/**
 * PermissionPanel — primes the OS prompt or, on denial, becomes a graceful
 * library-only fallback with browser-specific recovery hints.
 */
const PermissionPanel = ({
  mode,
  status,
  error,
  busy,
  onRequest,
  onUpload,
  onBack,
}: {
  mode: CaptureMode;
  status: 'idle' | 'prompting' | 'granted' | 'denied' | 'unsupported';
  error: string | null;
  busy: boolean;
  onRequest: () => void;
  onUpload: () => void;
  onBack: () => void;
}) => {
  const device = mode === 'voice' ? 'microphone' : mode === 'video' ? 'camera and microphone' : 'camera';
  const blocked = status === 'denied' || status === 'unsupported';
  const Icon = blocked ? AlertCircle : ShieldCheck;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="bg-card rounded-2xl p-6 shadow-boutique flex flex-col items-center text-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            blocked ? 'bg-destructive/12' : 'bg-accent/15'
          }`}
        >
          <Icon size={26} className={blocked ? 'text-destructive' : 'text-accent'} />
        </div>

        {status === 'denied' && (
          <>
            <h3 className="font-display text-[18px] text-foreground leading-tight mb-2">
              Your {device} is blocked
            </h3>
            <p className="font-sans text-[12px] text-muted-foreground leading-relaxed max-w-[28ch]">
              No problem — you can still preserve this moment by uploading from your library, or re-enable access in your browser settings.
            </p>
          </>
        )}

        {status === 'unsupported' && (
          <>
            <h3 className="font-display text-[18px] text-foreground leading-tight mb-2">
              Capture isn't available
            </h3>
            <p className="font-sans text-[12px] text-muted-foreground leading-relaxed max-w-[28ch]">
              {error ?? 'This browser or device can\u2019t reach the camera or mic right now. The library is always open.'}
            </p>
          </>
        )}

        {(status === 'idle' || status === 'prompting' || status === 'granted') && (
          <>
            <h3 className="font-display text-[18px] text-foreground leading-tight mb-2">
              We need your {device}
            </h3>
            <p className="font-sans text-[12px] text-muted-foreground leading-relaxed max-w-[30ch]">
              The next prompt is from your browser. Nothing leaves this device — your moments stay in the Vault, just for you.
            </p>
          </>
        )}
      </div>

      {/* Recovery hint for denial */}
      {status === 'denied' && (
        <div className="mt-3 bg-transparent border border-border rounded-xl p-3 flex items-start gap-2.5">
          <Settings size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
            To re-enable: tap the lock or info icon in your browser's address bar, then allow {device} access for this site and reload.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5 mt-5">
        {!blocked && (
          <button
            onClick={onRequest}
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {busy ? 'Waiting for permission\u2026' : `Allow ${device} access`}
          </button>
        )}

        <button
          onClick={onUpload}
          className={`w-full py-3.5 rounded-2xl font-sans text-[12px] uppercase tracking-sovereign cursor-pointer border flex items-center justify-center gap-2 ${
            blocked
              ? 'bg-primary text-primary-foreground border-none font-semibold'
              : 'bg-transparent text-foreground border-border'
          }`}
        >
          <Upload size={14} />
          Upload from library
        </button>

        <button
          onClick={onBack}
          className="w-full py-2.5 rounded-2xl bg-transparent text-muted-foreground font-sans text-[11px] uppercase tracking-sovereign cursor-pointer border-none"
        >
          Back
        </button>
      </div>
    </div>
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
