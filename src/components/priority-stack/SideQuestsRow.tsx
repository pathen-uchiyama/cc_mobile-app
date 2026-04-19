import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, X } from 'lucide-react';
import MemoryMakerWidget from '@/components/MemoryMakerWidget';
import FindAndSeekWidget from '@/components/FindAndSeekWidget';

type Quest = 'memory' | 'seek' | null;

/**
 * Side Quests — a single horizontal chip row.
 *
 * Memory Maker and Find & Seek live here as discoverable chips.
 * Tapping opens the full widget in a sheet. Visually subordinate
 * to the plan, but always within thumb-reach.
 */
const SideQuestsRow = () => {
  const [active, setActive] = useState<Quest>(null);

  return (
    <>
      <div className="flex items-center gap-2 px-1 overflow-x-auto no-scrollbar">
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign font-semibold shrink-0 mr-1"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          Side Quests
        </span>
        <button
          onClick={() => setActive('memory')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border-none cursor-pointer"
          style={{ boxShadow: '0 2px 8px hsl(var(--obsidian) / 0.04)' }}
        >
          <Camera size={11} className="text-accent" />
          <span className="font-sans text-[11px] text-foreground/85">Memory Maker</span>
        </button>
        <button
          onClick={() => setActive('seek')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border-none cursor-pointer"
          style={{ boxShadow: '0 2px 8px hsl(var(--obsidian) / 0.04)' }}
        >
          <Search size={11} className="text-primary" />
          <span className="font-sans text-[11px] text-foreground/85">Find &amp; Seek</span>
        </button>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'hsl(var(--obsidian) / 0.4)' }}
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] bg-background rounded-t-3xl p-5 pb-8"
              style={{ minHeight: '60vh' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                  Side Quest
                </span>
                <button
                  onClick={() => setActive(null)}
                  className="bg-transparent border-none cursor-pointer p-1"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div style={{ minHeight: '50vh' }}>
                {active === 'memory' ? <MemoryMakerWidget /> : <FindAndSeekWidget />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SideQuestsRow;
