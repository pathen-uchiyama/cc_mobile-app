import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Sparkles, Check } from 'lucide-react';

interface SeekItem {
  id: string;
  name: string;
  hint: string;
  land: string;
  found: boolean;
}

const SEEK_ITEMS: SeekItem[] = [
  { id: '1', name: 'Hidden Pascal', hint: 'Near a tangled tower', land: 'Fantasyland', found: false },
  { id: '2', name: 'Hitchhiking Ghost', hint: 'Shadows follow you home', land: 'Liberty Sq.', found: true },
  { id: '3', name: 'Orange Bird', hint: 'Near Sunshine Tree', land: 'Adventureland', found: false },
  { id: '4', name: 'Madame Leota', hint: 'The crystal ball knows all', land: 'Liberty Sq.', found: true },
  { id: '5', name: "Figment's Paint", hint: 'A purple splash', land: 'Tomorrowland', found: false },
];

const CELEBRATE_EMOJIS = ['🎉', '✨', '⭐', '🏆', '🌟'];

const FindAndSeekWidget = () => {
  const [items, setItems] = useState(SEEK_ITEMS);
  const [justFound, setJustFound] = useState<string | null>(null);
  const [celebrateEmoji, setCelebrateEmoji] = useState('✨');

  const foundCount = items.filter(i => i.found).length;
  const activeItem = items.find(i => !i.found);

  const markFound = (id: string) => {
    setCelebrateEmoji(CELEBRATE_EMOJIS[Math.floor(Math.random() * CELEBRATE_EMOJIS.length)]);
    setJustFound(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, found: true } : i));
    setTimeout(() => setJustFound(null), 1800);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Search size={12} className="text-primary" />
          <span className="font-display text-sm text-foreground">Find & Seek</span>
        </div>
        <div className="flex items-center gap-0.5">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={`w-1.5 h-1.5 ${item.found ? 'bg-accent' : 'bg-border'}`}
              animate={item.id === justFound ? { scale: [1, 2, 1] } : {}}
            />
          ))}
        </div>
      </div>

      {/* Quest card — fills available space */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeItem && !justFound && (
            <motion.button
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => markFound(activeItem.id)}
              className="w-full h-full bg-card p-4 shadow-boutique rounded-xl border-none cursor-pointer text-left flex flex-col justify-between relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"
                animate={{ translateX: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />
              <div className="relative">
                <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
                  {activeItem.land}
                </span>
                <h4 className="font-display text-base text-foreground mt-1 leading-tight">
                  {activeItem.name}
                </h4>
                <p className="font-display italic text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  "{activeItem.hint}"
                </p>
              </div>
              <div className="relative flex items-center justify-between mt-3">
                <span className="font-sans text-[8px] text-muted-foreground uppercase tracking-sovereign">
                  Tap when found
                </span>
                <Sparkles size={12} className="text-accent/60" />
              </div>
            </motion.button>
          )}

          {justFound && (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full h-full bg-card shadow-boutique rounded-xl flex flex-col items-center justify-center"
            >
              <motion.span
                className="text-3xl mb-2"
                animate={{ scale: [1, 1.3, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.5 }}
              >
                {celebrateEmoji}
              </motion.span>
              <span className="font-display text-sm text-foreground">Found it!</span>
              <span className="font-sans text-[9px] text-muted-foreground mt-0.5">
                {foundCount}/{items.length}
              </span>
            </motion.div>
          )}

          {!activeItem && !justFound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full bg-card shadow-boutique rounded-xl flex flex-col items-center justify-center"
            >
              <Check size={18} className="text-accent mb-2" />
              <span className="font-display text-sm text-foreground">All Found</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FindAndSeekWidget;
