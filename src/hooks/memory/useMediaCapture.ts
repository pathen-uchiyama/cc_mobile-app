import { useCallback, useEffect, useRef, useState } from 'react';

export type CaptureMode = 'photo' | 'video' | 'voice';

export type PermissionStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unsupported';

interface CaptureState {
  /** The active MediaStream — bind to a <video> for live preview */
  stream: MediaStream | null;
  /** Recording in progress */
  isRecording: boolean;
  /** Live duration in ms while recording */
  durationMs: number;
  /** Permission / device error message — surfaced to UI */
  error: string | null;
  /** True if getUserMedia is unavailable (insecure context, no API). */
  unsupported: boolean;
  /** Structured permission lifecycle — drives priming/denial UI. */
  permission: PermissionStatus;
}

interface CaptureResult {
  /** Data URL (image, video, or audio) */
  dataUrl: string;
  mime: string;
  durationMs?: number;
}

/**
 * useMediaCapture — thin wrapper around getUserMedia + MediaRecorder.
 *
 * Auto-stops video/voice at MAX_RECORDING_MS to keep payloads vault-friendly.
 */
export const useMediaCapture = (mode: CaptureMode) => {
  const [state, setState] = useState<CaptureState>({
    stream: null,
    isRecording: false,
    durationMs: 0,
    error: null,
    unsupported: false,
    permission: 'idle',
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickerRef = useRef<number | null>(null);
  const resolveRef = useRef<((r: CaptureResult) => void) | null>(null);
  const rejectRef = useRef<((e: Error) => void) | null>(null);

  const MAX_RECORDING_MS = mode === 'video' ? 10_000 : 60_000;

  const stopStream = useCallback(() => {
    setState((s) => {
      s.stream?.getTracks().forEach((t) => t.stop());
      return { ...s, stream: null };
    });
  }, []);

  /** Acquire the camera / mic. Bind the returned stream to a <video> element. */
  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({
        ...s,
        unsupported: true,
        permission: 'unsupported',
        error: 'Camera and mic are not available in this browser. You can still upload from your library.',
      }));
      return null;
    }
    setState((s) => ({ ...s, permission: 'prompting', error: null }));
    try {
      const constraints: MediaStreamConstraints =
        mode === 'voice'
          ? { audio: true }
          : mode === 'photo'
          ? { video: { facingMode: 'environment' }, audio: false }
          : { video: { facingMode: 'environment' }, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setState({ stream, isRecording: false, durationMs: 0, error: null, unsupported: false, permission: 'granted' });
      return stream;
    } catch (err) {
      const isDenied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      const isMissing = err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError');
      const message = isDenied
        ? 'Permission was denied. You can still upload from your library.'
        : isMissing
        ? 'No camera or microphone was found on this device. Try uploading from your library instead.'
        : 'We couldn\u2019t access the camera or mic. Try again or upload instead.';
      setState((s) => ({
        ...s,
        error: message,
        permission: isDenied ? 'denied' : isMissing ? 'unsupported' : s.permission === 'prompting' ? 'idle' : s.permission,
        unsupported: s.unsupported || isMissing,
      }));
      return null;
    }
  }, [mode]);

  const stop = useCallback(() => {
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    stopStream();
  }, [stopStream]);

  /** Capture a still frame from the active video stream and return a JPEG data URL. */
  const capturePhoto = useCallback(async (videoEl: HTMLVideoElement): Promise<CaptureResult> => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopStream();
    return { dataUrl, mime: 'image/jpeg' };
  }, [stopStream]);

  /** Begin recording video or voice. Resolves when stop() is called or MAX hits. */
  const startRecording = useCallback(
    (stream: MediaStream): Promise<CaptureResult> => {
      return new Promise((resolve, reject) => {
        try {
          const mime =
            mode === 'voice'
              ? (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4')
              : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4');
          const recorder = new MediaRecorder(stream, { mimeType: mime });
          recorderRef.current = recorder;
          chunksRef.current = [];
          startedAtRef.current = Date.now();
          resolveRef.current = resolve;
          rejectRef.current = reject;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = async () => {
            const durationMs = Date.now() - startedAtRef.current;
            const blob = new Blob(chunksRef.current, { type: mime });
            const reader = new FileReader();
            reader.onloadend = () => {
              const result: CaptureResult = {
                dataUrl: reader.result as string,
                mime,
                durationMs,
              };
              setState((s) => ({ ...s, isRecording: false, durationMs: 0 }));
              resolveRef.current?.(result);
              resolveRef.current = null;
              rejectRef.current = null;
            };
            reader.onerror = () => {
              rejectRef.current?.(new Error('Failed to read recording'));
              resolveRef.current = null;
              rejectRef.current = null;
            };
            reader.readAsDataURL(blob);
          };

          recorder.start(100);
          setState((s) => ({ ...s, isRecording: true, durationMs: 0 }));

          // Live duration ticker
          tickerRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startedAtRef.current;
            setState((s) => ({ ...s, durationMs: elapsed }));
            if (elapsed >= MAX_RECORDING_MS) {
              stop();
            }
          }, 100);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Recorder failed'));
        }
      });
    },
    [mode, MAX_RECORDING_MS, stop]
  );

  // Always release the camera / mic when the component unmounts.
  useEffect(() => {
    return () => {
      if (tickerRef.current) window.clearInterval(tickerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* ignore */ }
      }
      // Use ref to avoid closure on stale state
      // (state.stream may be stale by unmount time; tracks are stopped via stop())
    };
  }, []);

  return { ...state, start, stop, startRecording, capturePhoto, maxRecordingMs: MAX_RECORDING_MS };
};
