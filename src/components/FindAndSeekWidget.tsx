import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Check, ChevronRight } from 'lucide-react';

interface SeekItem {
  id: string;
  name: string;
  hint: string;
  land: string;
  found: boolean;
}

const SEEK_ITEMS: SeekItem[] = [
  { id: '1', name: 'Hidden Pascal', hint: 'Near the entrance to a tangled tower', land: 'Fantasyland', found: false },
  { id: '2', name: 'Hitchhiking Ghost', hint: 'Look for shadows that follow you home', land: 'Liberty Square', found: true },
  { id: '3', name: 'Orange Bird', hint: 'A citrus companion near Sunshine Tree', land: 'Adventureland', found: false },
  { id: '4', name: 'Madame Leota', hint: 'The crystal ball knows all', land: 'Liberty Square', found: true },
  { id: '5', name: 'Figment\'s Paint', hint: 'A purple splash of imagination', land: 'Tomorrowland', found: false },
];

const FindAndSeekWidget = () => {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(SEEK_ITEMS);
  const [revealedHint, setRevealedHint] = useState<string | null>(null);

  const foundCount = items.filter(i => i.found).length;
  const progress = (foundCount / items.length) * 100;

  const toggleFound = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, found: !i.found } : i));
  };

  return (
    <div className="px-6 mb-6">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-card p-5 shadow-boutique border-none cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 flex items-center justify-center">
              <Search size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-display text-base text-foreground">Find & Seek</h3>
              <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mt-0.5">
                {foundCount} / {items.length} discovered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mini progress ring */}
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" fill="none" className="stroke-muted" strokeWidth="2" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                className="stroke-primary"
                strokeWidth="2"
                strokeDasharray={`${progress * 0.69} 69`}
                strokeLinecap="round"
                transform="rotate(-90 14 14)"
              />
            </svg>
          </div>
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
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-card/60 p-4 shadow-boutique transition-opacity ${item.found ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => toggleFound(item.id)}
                        className={`w-6 h-6 flex items-center justify-center border cursor-pointer transition-colors ${
                          item.found
                            ? 'bg-primary border-primary'
                            : 'bg-transparent border-border'
                        }`}
                      >
                        {item.found && <Check size={12} className="text-primary-foreground" />}
                      </motion.button>
                      <div>
                        <p className={`font-sans text-xs font-semibold ${item.found ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.name}
                        </p>
                        <p className="font-sans text-[10px] text-muted-foreground">{item.land}</p>
                      </div>
                    </div>

                    {!item.found && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setRevealedHint(revealedHint === item.id ? null : item.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-transparent border-none cursor-pointer"
                      >
                        <MapPin size={10} className="text-accent" />
                        <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent">Hint</span>
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {revealedHint === item.id && !item.found && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="font-display italic text-xs text-muted-foreground pl-9 pt-1"
                      >
                        "{item.hint}"
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FindAndSeekWidget;
