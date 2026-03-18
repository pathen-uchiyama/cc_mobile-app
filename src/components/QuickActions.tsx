import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bath, TreePine, Mic, Heart, Home, User } from 'lucide-react';
import { useState } from 'react';

interface QuickActionsProps {
  onBathroom: () => void;
  onQuietSpace: () => void;
  onMemory: () => void;
  onPulse: () => void;
}

const actions = [
  { id: 'bathroom', label: 'Restroom', icon: Bath },
  { id: 'quiet', label: 'Quiet Space', icon: TreePine },
  { id: 'memory', label: 'Memory', icon: Mic },
  { id: 'pulse', label: 'Pulse', icon: Heart },
] as const;

const QuickActions = ({ onBathroom, onQuietSpace, onMemory, onPulse }: QuickActionsProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handlers: Record<string, () => void> = {
    bathroom: onBathroom,
    quiet: onQuietSpace,
    memory: onMemory,
    pulse: onPulse,
  };

  return (
    <div className="px-6 pb-8 pt-4 relative">
      <div className="flex items-center justify-around">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.92 }}
              onClick={handlers[action.id]}
              className="flex flex-col items-center gap-2 min-w-[64px] min-h-[64px] justify-center bg-transparent border-none cursor-pointer"
              aria-label={action.label}
            >
              <div className="w-12 h-12 bg-card shadow-boutique flex items-center justify-center">
                <Icon size={18} className="text-foreground" />
              </div>
              <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Menu FAB — bottom right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-card shadow-boutique-hover p-2 mb-1 flex flex-col gap-1 min-w-[140px]"
          >
            <button
              onClick={() => { setMenuOpen(false); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <Home size={16} className="text-foreground" />
              <span className="font-sans text-xs text-foreground">Home</span>
            </button>
            <div className="h-px bg-border/30 mx-2" />
            <button
              onClick={() => { setMenuOpen(false); navigate('/auth'); }}
              className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <User size={16} className="text-foreground" />
              <span className="font-sans text-xs text-foreground">Account</span>
            </button>
          </motion.div>
        )}

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setMenuOpen((v) => !v)}
          className="w-12 h-12 bg-primary shadow-boutique-hover flex items-center justify-center cursor-pointer border-none"
          aria-label="Menu"
        >
          <User size={18} className="text-primary-foreground" />
        </motion.button>
      </div>
    </div>
  );
};

export default QuickActions;
