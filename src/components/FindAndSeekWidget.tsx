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
  { id: '1', name: 'Hidden Pascal', hint: 'Near the entrance to a tangled tower', land: 'Fantasyland', found: false },
  { id: '2', name: 'Hitchhiking Ghost', hint: 'Look for shadows that follow you home', land: 'Liberty Square', found: true },
  { id: '3', name: 'Orange Bird', hint: 'A citrus companion near Sunshine Tree', land: 'Adventureland', found: false },
  { id: '4', name: 'Madame Leota', hint: 'The crystal ball knows all', land: 'Liberty Square', found: true },
  { id: '5', name: "Figment's Paint", hint: 'A purple splash of imagination', land: 'Tomorrowland', found: false },
];

const CELEBRATE_EMOJIS = ['🎉', '✨', '⭐', '🏆', '🌟'];

const FindAndSeekWidget = () => {
  const [items, setItems] = useState(SEEK_ITEMS);
  const [justFound, setJustFound] = useState<string | null>(null);
  const [celebrateEmoji, setCelebrateEmoji] = useState('✨');

  const foundCount = items.filter(i => i.found).length;
  const progress = (foundCount / items.length) * 100;

  // Get the current active (not found) item to show as the "quest"
  const activeItem = items.find(i => !i.found);

  const markFound = (id: string) => {
    setCelebrateEmoji(CELEBRATE_EMOJIS[Math.floor(Math.random() * CELEBRATE_EMOJIS.length)]);
    setJustFound(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, found: true } : i));

    // Clear celebration after animation
    setTimeout(() => setJustFound(null), 1800);
  };

  return (
    <div>
      {/* Compact header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-primary" />
          <span className="font-display text-base text-foreground">Find & Seek</span>
        </div>
        {/* Progress pills */}
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={`w-2 h-2 transition-colors ${
                item.found ? 'bg-accent' : 'bg-border'
              }`}
              animate={item.id === justFound ? { scale: [1, 1.8, 1] } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
          <span className="font-sans text-[9px] text-muted-foreground ml-1.5 tabular-nums">
            {foundCount}/{items.length}
          </span>
        </div>
      </div>

      {/* Active quest card — the one to find next */}
      <AnimatePresence mode="wait">
        {activeItem && !justFound && (
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => markFound(activeItem.id)}
              className="w-full bg-card p-5 shadow-boutique border-none cursor-pointer text-left group relative overflow-hidden"
            >
              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent -translate-x-full"
                animate={{ translateX: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={10} className="text-accent" />
                  <span className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold">
                    {activeItem.land}
                  </span>
                </div>

                <h4 className="font-display text-lg text-foreground mb-1.5">
                  {activeItem.name}
                </h4>

                <p className="font-display italic text-xs text-muted-foreground leading-relaxed mb-4">
                  "{activeItem.hint}"
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
                    Tap when found
                  </span>
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Sparkles size={14} className="text-primary" />
                  </div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Celebration burst */}
        {justFound && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-card p-6 shadow-boutique flex flex-col items-center justify-center"
          >
            <motion.span
              className="text-4xl mb-3"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
            >
              {celebrateEmoji}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-lg text-foreground"
            >
              Found it!
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-sans text-[10px] text-muted-foreground mt-1"
            >
              {foundCount} of {items.length} discovered
            </motion.span>

            {/* Particle burst */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-accent"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 60,
                  y: Math.sin((i / 6) * Math.PI * 2) * 60,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
            ))}
          </motion.div>
        )}

        {/* All found state */}
        {!activeItem && !justFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card p-6 shadow-boutique flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-accent/15 flex items-center justify-center mb-3">
              <Check size={20} className="text-accent" />
            </div>
            <span className="font-display text-lg text-foreground">All Discovered</span>
            <span className="font-sans text-[10px] text-muted-foreground mt-1">
              You found every hidden treasure
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recently found — compact row of completed items */}
      {foundCount > 0 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto">
          {items.filter(i => i.found).map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 shrink-0"
            >
              <Check size={8} className="text-accent" />
              <span className="font-sans text-[9px] text-accent font-medium whitespace-nowrap">
                {item.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindAndSeekWidget;
