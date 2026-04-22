import { useEffect, useRef } from 'react';
import type { Memory } from '@/contexts/MemoryContext';

interface TrimmedVideoProps {
  memory: Pick<Memory, 'payload' | 'trimStart' | 'trimEnd'>;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
}

/**
 * TrimmedVideo — plays a saved video memory while honouring its trim window.
 *
 * The underlying clip is never modified; we just clamp playback to
 * [trimStart, trimEnd]. If no trim is set, behaves like a normal <video>.
 */
const TrimmedVideo = ({ memory, className, controls = true, autoPlay = false }: TrimmedVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const start = memory.trimStart ?? 0;
  const end = memory.trimEnd;

  useEffect(() => {
    const v = ref.current;
    if (!v || (start === 0 && end === undefined)) return;

    const onLoaded = () => {
      if (v.currentTime < start) v.currentTime = start;
    };
    const onTime = () => {
      if (end !== undefined && v.currentTime >= end - 0.05) {
        v.pause();
        v.currentTime = start;
      }
    };
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
    };
  }, [start, end]);

  return (
    <video
      ref={ref}
      src={memory.payload}
      controls={controls}
      autoPlay={autoPlay}
      playsInline
      className={className}
    />
  );
};

export default TrimmedVideo;
