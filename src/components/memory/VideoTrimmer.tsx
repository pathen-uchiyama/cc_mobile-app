import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Scissors } from 'lucide-react';

interface VideoTrimmerProps {
  src: string;
  /** Source duration in seconds. Falls back to metadata if 0. */
  initialDurationSec?: number;
  /** Maximum allowed trim length in seconds (default 10). */
  maxLengthSec?: number;
  /** Minimum allowed trim length in seconds (default 1). */
  minLengthSec?: number;
  /** Called whenever the trim window changes. */
  onChange: (start: number, end: number) => void;
}

const formatSec = (s: number) => {
  if (!isFinite(s) || s < 0) return '0.0s';
  return `${s.toFixed(1)}s`;
};

/**
 * VideoTrimmer — confirm a short clip length before saving.
 *
 * Two range handles drag start/end of a trim window (clamped to min/max),
 * the live preview loops through that window, and we expose the chosen
 * bounds via onChange so the parent can persist them as metadata.
 *
 * No re-encoding: the underlying clip is preserved verbatim and the trim
 * is applied at playback time. Cheap, lossless, reversible.
 */
const VideoTrimmer = ({
  src,
  initialDurationSec = 0,
  maxLengthSec = 10,
  minLengthSec = 1,
  onChange,
}: VideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(initialDurationSec);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(Math.min(maxLengthSec, initialDurationSec || maxLengthSec));
  const [playing, setPlaying] = useState(false);
  const [drag, setDrag] = useState<'start' | 'end' | null>(null);

  // Resolve duration once metadata loads — covers the case where capture
  // didn't expose durationMs (uploaded files often don't).
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    const d = isFinite(v.duration) && v.duration > 0 ? v.duration : initialDurationSec;
    setDuration(d);
    const initialEnd = Math.min(maxLengthSec, d);
    setEnd(initialEnd);
    onChange(0, initialEnd);
  };

  // Loop within trim window
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.currentTime >= end - 0.05 || v.currentTime < start - 0.1) {
        v.currentTime = start;
        if (!playing) v.pause();
      }
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [start, end, playing]);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      if (v.currentTime < start || v.currentTime >= end) v.currentTime = start;
      try {
        await v.play();
        setPlaying(true);
      } catch { /* autoplay/codec issue — silent */ }
    }
  };

  // Drag → trim window. Pointer-based so it works for mouse + touch.
  useEffect(() => {
    if (!drag) return;
    const handleMove = (e: PointerEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || !duration) return;
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const t = ratio * duration;
      if (drag === 'start') {
        const next = Math.min(t, end - minLengthSec);
        const clamped = Math.max(0, Math.min(next, end - minLengthSec));
        // Also enforce max window
        const newStart = Math.max(clamped, end - maxLengthSec);
        setStart(newStart);
        onChange(newStart, end);
        if (videoRef.current) videoRef.current.currentTime = newStart;
      } else {
        const next = Math.max(t, start + minLengthSec);
        const clamped = Math.min(duration, Math.max(next, start + minLengthSec));
        const newEnd = Math.min(clamped, start + maxLengthSec);
        setEnd(newEnd);
        onChange(start, newEnd);
        if (videoRef.current) videoRef.current.currentTime = newEnd - 0.05;
      }
    };
    const handleUp = () => setDrag(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [drag, duration, start, end, minLengthSec, maxLengthSec, onChange]);

  const length = end - start;
  const startPct = duration > 0 ? (start / duration) * 100 : 0;
  const endPct = duration > 0 ? (end / duration) * 100 : 100;
  const tooLong = duration > maxLengthSec;

  return (
    <div className="bg-foreground rounded-2xl overflow-hidden">
      {/* Preview */}
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          playsInline
          muted
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setPlaying(false)}
          className="w-full aspect-[4/5] object-cover bg-foreground"
        />

        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer"
        >
          {!playing && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center"
            >
              <Play size={20} className="text-foreground ml-0.5" fill="currentColor" />
            </motion.div>
          )}
        </button>

        {/* Length pill */}
        <div className="absolute top-3 right-3 bg-background/85 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
          <Scissors size={11} className="text-accent" />
          <span className="font-sans text-[11px] tabular-nums text-foreground font-semibold">
            {formatSec(length)}
          </span>
        </div>
      </div>

      {/* Trim track */}
      <div className="px-4 py-4 bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Trim window
          </span>
          <span className="font-sans text-[10px] tabular-nums text-muted-foreground">
            {formatSec(start)} <span className="opacity-50">→</span> {formatSec(end)}
          </span>
        </div>

        <div
          ref={trackRef}
          className="relative h-9 bg-muted rounded-full select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Selected window */}
          <div
            className="absolute top-0 bottom-0 bg-accent/30 border-y-2 border-accent rounded-full"
            style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
          />
          {/* Start handle */}
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setDrag('start'); }}
            aria-label="Drag to set start"
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-9 rounded-lg bg-card border-2 border-accent shadow-boutique cursor-ew-resize touch-none"
            style={{ left: `${startPct}%` }}
          >
            <span className="block w-0.5 h-3 bg-accent mx-auto rounded-full" />
          </button>
          {/* End handle */}
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setDrag('end'); }}
            aria-label="Drag to set end"
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-9 rounded-lg bg-card border-2 border-accent shadow-boutique cursor-ew-resize touch-none"
            style={{ left: `${endPct}%` }}
          >
            <span className="block w-0.5 h-3 bg-accent mx-auto rounded-full" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-foreground font-sans text-[11px] uppercase tracking-sovereign font-semibold"
          >
            {playing ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
            {playing ? 'Pause' : 'Preview'}
          </button>
          <span className="font-sans text-[10px] text-muted-foreground tabular-nums">
            of {formatSec(duration)} source
          </span>
        </div>

        {tooLong && (
          <p className="mt-2 font-sans text-[10px] text-accent leading-snug">
            Capped at {maxLengthSec}s. Drag the handles to keep the best moment.
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoTrimmer;
