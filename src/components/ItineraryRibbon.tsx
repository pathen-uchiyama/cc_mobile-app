import { useState, useCallback } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Lock, GripVertical } from 'lucide-react';

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  wait?: string;
  type: 'standard' | 'premium' | 'dining' | 'show';
  locked?: boolean;
  llStatus?: boolean;
}

const DraggableCard = ({ item, onCollision }: { item: ItineraryItem; onCollision?: () => void }) => {
  const [isShaking, setIsShaking] = useState(false);

  const dotColor = item.type === 'premium' ? 'bg-gold' : item.type === 'dining' ? 'bg-thistle' : item.type === 'show' ? 'bg-sienna' : 'bg-slate-plaid';

  return (
    <Reorder.Item
      value={item}
      dragListener={!item.locked}
      className={`relative pl-12 mb-6 group ${item.locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isShaking ? 'animate-shake' : ''}`}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      onDragEnd={() => {
        if (item.locked) {
          setIsShaking(true);
          onCollision?.();
          setTimeout(() => setIsShaking(false), 500);
        }
      }}
    >
      {/* Spine dot */}
      <div className={`absolute left-[23px] top-3 w-3 h-3 z-10 ${dotColor}`} />

      <div className={`bg-card p-5 shadow-boutique transition-all duration-300 ${item.locked ? 'border-l-4 border-obsidian' : 'hover:shadow-boutique-hover'} ${isShaking ? 'border-2 border-sienna' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="font-sans tabular-nums text-2xl font-light tracking-tighter text-foreground">
            {item.time}
          </span>
          <div className="flex items-center gap-2">
            {item.locked && <Lock size={14} className="text-slate-plaid" />}
            {!item.locked && <GripVertical size={14} className="text-slate-plaid opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
        </div>

        <h3 className="font-display text-lg text-foreground mb-1">{item.title}</h3>

        <div className="flex items-center gap-4 mt-3">
          {item.wait && (
            <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">
              Wait: <span className="text-foreground font-bold">{item.wait}</span>
            </span>
          )}
          {item.llStatus && (
            <span className="px-2 py-1 bg-thistle/10 text-thistle text-[9px] uppercase tracking-tighter font-bold">
              Lightning Lane Secured
            </span>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};

const SAMPLE_ITEMS: ItineraryItem[] = [
  { id: '1', time: '09:00', title: 'Space Mountain', wait: '45m', type: 'premium', llStatus: true },
  { id: '2', time: '10:15', title: 'Pirates of the Caribbean', wait: '25m', type: 'standard' },
  { id: '3', time: '11:30', title: "Be Our Guest Restaurant", type: 'dining', locked: true },
  { id: '4', time: '13:00', title: 'Haunted Mansion', wait: '35m', type: 'standard' },
  { id: '5', time: '14:30', title: 'Big Thunder Mountain', wait: '50m', type: 'premium', llStatus: true },
  { id: '6', time: '16:00', title: 'Enchantment Fireworks', type: 'show', locked: true },
];

const ItineraryRibbon = () => {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [flashedIds, setFlashedIds] = useState<string[]>([]);

  const handleReorder = useCallback((newItems: ItineraryItem[]) => {
    // Prevent locked items from moving
    const lockedPositions = SAMPLE_ITEMS
      .map((item, idx) => item.locked ? { item, idx } : null)
      .filter(Boolean);

    setItems(newItems);

    // Flash cards below the moved card
    const ids = newItems.slice(2).map(i => i.id);
    setFlashedIds(ids);
    setTimeout(() => setFlashedIds([]), 400);
  }, []);

  return (
    <div className="relative px-6 pt-4 pb-32">
      <h2 className="font-display text-2xl text-foreground mb-1">The Voyage Canvas</h2>
      <p className="font-sans text-xs text-muted-foreground mb-8 uppercase tracking-sovereign">Your day, composed.</p>

      {/* The Spine */}
      <div className="absolute left-[52px] top-[120px] bottom-32 w-[2px] bg-slate-divider" />

      <Reorder.Group axis="y" values={items} onReorder={handleReorder}>
        {items.map((item) => (
          <div key={item.id} className={flashedIds.includes(item.id) ? 'animate-flash' : ''}>
            <DraggableCard item={item} />
          </div>
        ))}
      </Reorder.Group>

      {/* End marker */}
      <div className="pl-12 mt-4">
        <div className="absolute left-[23px] w-3 h-3 bg-obsidian" style={{ marginLeft: '29px' }} />
        <p className="font-display italic text-sm text-muted-foreground">Park Close — The day is composed.</p>
      </div>
    </div>
  );
};

export default ItineraryRibbon;
