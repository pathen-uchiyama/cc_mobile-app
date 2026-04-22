import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, FileText, Square, ArrowRight, Check, SkipForward, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { useMediaCapture } from '@/hooks/memory/useMediaCapture';
import { useMemoryVault, type InterviewPhase } from '@/contexts/MemoryContext';
import { useCelebrate } from '@/contexts/CelebrationContext';
import { supabase } from '@/integrations/supabase/client';

interface InterviewSheetProps {
  open: boolean;
  onClose: () => void;
  phase: InterviewPhase;
}

const PRE_QUESTIONS = [
  {
    eyebrow: 'Before the gates',
    title: 'What are you most excited for today?',
    placeholder: 'The first ride? A specific snack? A reunion?',
  },
  {
    eyebrow: 'Who you\u2019re with',
    title: 'Who is in your party — and what makes them special?',
    placeholder: 'A name, a quirk, a moment you hope to share with them.',
  },
  {
    eyebrow: 'The one thing',
    title: 'What would make today perfect?',
    placeholder: 'One concrete moment we should chase for you.',
  },
];

const POST_QUESTIONS = [
  {
    eyebrow: 'The peak',
    title: 'What was your favorite moment?',
    placeholder: 'The single second you\u2019d freeze if you could.',
  },
  {
    eyebrow: 'The surprise',
    title: 'What surprised you?',
    placeholder: 'Something unexpected — good or strange or sweet.',
  },
  {
    eyebrow: 'The forever',
    title: 'What do you want to remember forever?',
    placeholder: 'The detail that will outlive the photos.',
  },
];

const formatMs = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const InterviewSheet = ({ open, onClose, phase }: InterviewSheetProps) => {
  const { saveInterview, markPhaseComplete } = useMemoryVault();
  const { celebrate } = useCelebrate();

  const questions = phase === 'pre' ? PRE_QUESTIONS : POST_QUESTIONS;
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'note' | 'voice'>('note');
  const [body, setBody] = useState('');
  const [voiceCapture, setVoiceCapture] = useState<{ payload: string; durationMs: number } | null>(null);
  const [busy, setBusy] = useState(false);
  // Transcription is opt-in: a separate state machine so users can keep the
  // raw voice memo even if they never tap Transcribe.
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  /** True once a transcript has been pulled into `body` for the current voice clip. */
  const [hasTranscript, setHasTranscript] = useState(false);

  const capture = useMediaCapture('voice');

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setMode('note');
      setBody('');
      setVoiceCapture(null);
      capture.stop();
      setTranscribing(false);
      setTranscriptError(null);
      setHasTranscript(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[index];
  const isLast = index === questions.length - 1;

  const startVoice = async () => {
    setMode('voice');
    setVoiceCapture(null);
    setHasTranscript(false);
    setTranscriptError(null);
    setBody('');
    const stream = await capture.start();
    if (!stream) return;
    try {
      const r = await capture.startRecording(stream);
      setVoiceCapture({ payload: r.dataUrl, durationMs: r.durationMs });
    } catch { /* ignore */ }
  };

  const stopVoice = () => capture.stop();

  const handleTranscribe = async () => {
    if (!voiceCapture) return;
    setTranscribing(true);
    setTranscriptError(null);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: voiceCapture.payload },
      });
      if (error) throw error;
      const text = (data as { text?: string; error?: string } | null)?.text?.trim();
      const apiError = (data as { error?: string } | null)?.error;
      if (apiError) throw new Error(apiError);
      if (!text) {
        setTranscriptError('We couldn\u2019t make out the words. Your voice memo is still saved.');
      } else {
        setBody(text);
        setHasTranscript(true);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      const msg = err instanceof Error ? err.message : 'Transcription failed.';
      setTranscriptError(msg);
    } finally {
      setTranscribing(false);
    }
  };

  const advance = () => {
    if (isLast) {
      markPhaseComplete(phase);
      celebrate(
        phase === 'pre' ? 'Your hopes are tucked into the Vault.' : 'Your day, preserved in your own words.',
        phase === 'pre' ? 'Ready' : 'Vault Sealed'
      );
      onClose();
      return;
    }
    setIndex((i) => i + 1);
    setBody('');
    setVoiceCapture(null);
    setMode('note');
    setHasTranscript(false);
    setTranscriptError(null);
  };

  const saveAndAdvance = () => {
    setBusy(true);
    // If we have a transcript, save it as a note so the user gets their
    // refined text. Otherwise fall back to the raw voice clip.
    if (mode === 'voice' && voiceCapture && hasTranscript && body.trim()) {
      saveInterview({ phase, question: q.title, kind: 'note', payload: body.trim() });
    } else if (mode === 'note' && body.trim()) {
      saveInterview({ phase, question: q.title, kind: 'note', payload: body.trim() });
    } else if (mode === 'voice' && voiceCapture) {
      saveInterview({ phase, question: q.title, kind: 'voice', payload: voiceCapture.payload, durationMs: voiceCapture.durationMs });
    }
    setBusy(false);
    advance();
  };

  const skip = () => advance();

  const canSave =
    (mode === 'note' && body.trim().length > 0) ||
    (mode === 'voice' && voiceCapture !== null);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snap="full"
      eyebrow={`${q.eyebrow} · Question ${index + 1} of ${questions.length}`}
      title={q.title}
      subtitle={phase === 'pre' ? 'Your answers shape the day we plan around you.' : 'A short interview while it\u2019s still warm.'}
    >
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('note'); capture.stop(); setVoiceCapture(null); }}
          className={`flex-1 py-2.5 rounded-xl border font-sans text-[11px] uppercase tracking-sovereign cursor-pointer flex items-center justify-center gap-2 transition-colors ${
            mode === 'note' ? 'bg-accent/15 border-accent/50 text-accent font-semibold' : 'bg-transparent border-border text-muted-foreground'
          }`}
        >
          <FileText size={13} /> Type it
        </button>
        <button
          onClick={() => { if (mode !== 'voice') startVoice(); }}
          className={`flex-1 py-2.5 rounded-xl border font-sans text-[11px] uppercase tracking-sovereign cursor-pointer flex items-center justify-center gap-2 transition-colors ${
            mode === 'voice' ? 'bg-accent/15 border-accent/50 text-accent font-semibold' : 'bg-transparent border-border text-muted-foreground'
          }`}
        >
          <Mic size={13} /> Speak it
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'note' ? (
          <motion.textarea
            key={`note-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={q.placeholder}
            rows={6}
            className="w-full bg-card border border-border rounded-2xl p-4 font-display italic text-[15px] text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
        ) : (
          <motion.div
            key={`voice-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-foreground rounded-2xl aspect-[4/3] flex flex-col items-center justify-center"
          >
            {capture.error ? (
              <p className="font-sans text-[12px] text-destructive-foreground bg-destructive/30 px-4 py-2 rounded-lg">
                {capture.error}
              </p>
            ) : voiceCapture ? (
              <div className="w-full px-5 py-6 flex flex-col items-center">
                <Check size={32} className="text-accent mb-2" />
                <p className="font-display italic text-[14px] text-background mb-3">
                  Captured · {formatMs(voiceCapture.durationMs)}
                </p>
                <audio src={voiceCapture.payload} controls className="w-full max-w-[320px] mb-4" />

                {/* Transcribe CTA — opt-in, surfaces only here */}
                {!hasTranscript && (
                  <button
                    onClick={handleTranscribe}
                    disabled={transcribing}
                    className="bg-card text-foreground rounded-xl px-4 py-2.5 font-sans text-[11px] uppercase tracking-sovereign font-semibold cursor-pointer border-none flex items-center gap-2 disabled:opacity-60"
                  >
                    {transcribing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} className="text-accent" />
                    )}
                    {transcribing ? 'Listening back\u2026' : 'Transcribe to text'}
                  </button>
                )}

                {hasTranscript && (
                  <span className="font-sans text-[10px] uppercase tracking-sovereign text-accent font-semibold">
                    Transcript ready below — review &amp; refine
                  </span>
                )}

                {transcriptError && (
                  <div className="mt-3 max-w-[320px] flex items-start gap-2 bg-destructive/15 text-destructive-foreground rounded-lg px-3 py-2">
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-[11px] leading-snug">{transcriptError}</span>
                  </div>
                )}

                <button
                  onClick={startVoice}
                  className="mt-4 underline bg-transparent border-none text-background/70 font-sans text-[11px] cursor-pointer"
                >
                  Re-record
                </button>
              </div>
            ) : capture.isRecording ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-4"
                >
                  <Mic size={32} className="text-accent" />
                </motion.div>
                <p className="font-display italic text-[15px] text-background">Listening…</p>
                <span className="font-sans text-[12px] tabular-nums text-background/70 mt-2">
                  {formatMs(capture.durationMs)}
                </span>
                <button
                  onClick={stopVoice}
                  className="mt-4 w-14 h-14 rounded-full bg-destructive flex items-center justify-center cursor-pointer border-none"
                  aria-label="Stop recording"
                >
                  <Square size={20} className="text-destructive-foreground" fill="currentColor" />
                </button>
              </>
            ) : (
              <Loader2 size={28} className="text-background/60 animate-spin" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript review — only when we have one from voice mode */}
      {mode === 'voice' && hasTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} className="text-accent" />
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">
              Your words, transcribed
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full bg-card border border-border rounded-2xl p-4 font-display italic text-[15px] text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
          <p className="font-sans text-[10px] text-muted-foreground mt-1.5 leading-snug">
            Editing here saves the text instead of the audio clip.
          </p>
        </motion.div>
      )}

      {/* Action row */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={skip}
          className="flex-1 py-3.5 rounded-2xl bg-transparent border border-border text-muted-foreground font-sans text-[12px] uppercase tracking-sovereign cursor-pointer flex items-center justify-center gap-2"
        >
          <SkipForward size={13} /> Skip
        </button>
        <button
          onClick={saveAndAdvance}
          disabled={!canSave || busy}
          className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground font-sans text-[12px] uppercase tracking-sovereign font-semibold cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : isLast ? <Check size={14} /> : <ArrowRight size={14} />}
          {isLast ? 'Seal the Vault' : 'Save & next'}
        </button>
      </div>
    </BottomSheet>
  );
};

export default InterviewSheet;
