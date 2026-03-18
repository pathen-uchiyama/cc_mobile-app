import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Image, X } from 'lucide-react';

const MOCK_PHOTOS = [
  { id: '1', label: 'Space Mountain Exit', time: '11:42 AM', status: 'ready' as const },
  { id: '2', label: 'Seven Dwarfs Mine Train', time: '1:15 PM', status: 'processing' as const },
  { id: '3', label: 'Cinderella Castle Meet', time: '2:30 PM', status: 'ready' as const },
];

const MemoryMakerWidget = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-card p-5 shadow-boutique border-none cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 flex items-center justify-center">
              <Camera size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-display text-base text-foreground">Memory Maker</h3>
              <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mt-0.5">
                {MOCK_PHOTOS.filter(p => p.status === 'ready').length} photos ready
              </p>
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={16} className="text-muted-foreground" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2">
              {MOCK_PHOTOS.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card/60 p-4 flex items-center justify-between shadow-boutique"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted flex items-center justify-center">
                      <Image size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-sans text-xs font-semibold text-foreground">{photo.label}</p>
                      <p className="font-sans text-[10px] text-muted-foreground tabular-nums">{photo.time}</p>
                    </div>
                  </div>
                  <span className={`font-sans text-[9px] uppercase tracking-sovereign px-2 py-1 ${
                    photo.status === 'ready'
                      ? 'bg-accent/15 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {photo.status === 'ready' ? 'View' : 'Processing'}
                  </span>
                </motion.div>
              ))}

              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 bg-primary/10 border-none cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera size={14} className="text-primary" />
                <span className="font-sans text-[10px] uppercase tracking-sovereign text-primary">
                  Scan PhotoPass Card
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryMakerWidget;
