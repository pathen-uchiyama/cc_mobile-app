import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Check } from 'lucide-react';

const MOCK_PHOTOS = [
  { id: '1', label: 'Space Mountain Exit', time: '11:42 AM', status: 'ready' as const },
  { id: '2', label: 'Mine Train', time: '1:15 PM', status: 'processing' as const },
  { id: '3', label: 'Castle Meet', time: '2:30 PM', status: 'ready' as const },
];

const MemoryMakerWidget = () => {
  const readyCount = MOCK_PHOTOS.filter(p => p.status === 'ready').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Camera size={12} className="text-accent" />
          <span className="font-display text-sm text-foreground">Memory Maker</span>
        </div>
        <span className="font-sans text-[9px] text-accent font-bold tabular-nums">
          {readyCount} ready
        </span>
      </div>

      {/* Photo feed — fills space */}
      <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto">
        {MOCK_PHOTOS.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card p-3 shadow-boutique flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 bg-muted flex items-center justify-center shrink-0">
              <Image size={12} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[11px] font-semibold text-foreground truncate">
                {photo.label}
              </p>
              <p className="font-sans text-[9px] text-muted-foreground tabular-nums">
                {photo.time}
              </p>
            </div>
            <span className={`font-sans text-[8px] uppercase tracking-sovereign px-1.5 py-0.5 shrink-0 ${
              photo.status === 'ready'
                ? 'bg-accent/15 text-accent'
                : 'bg-muted text-muted-foreground'
            }`}>
              {photo.status === 'ready' ? 'View' : '...'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Scan CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="mt-2 w-full py-2 bg-primary/10 border-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
      >
        <Camera size={10} className="text-primary" />
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-primary font-semibold">
          Scan PhotoPass
        </span>
      </motion.button>
    </div>
  );
};

export default MemoryMakerWidget;
