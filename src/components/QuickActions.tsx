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
  { id: 'quiet', label: 'Quiet', icon: TreePine },
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
    <div className="relative">
      {/* Uber-style minimal bottom bar */}
      <div className="bg-background border-t border-border px-6 py-4">
        <div className="flex items-center justify-around">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.9 }}
                onClick={handlers[action.id]}
                className="flex flex-col items-center gap-1.5 min-w-[56px] min-h-[56px] justify-center bg-transparent border-none cursor-pointer"
                aria-label={action.label}
              >
                <Icon size={18} className="text-foreground" />
                <span className="font-sans text-[7px] uppercase tracking-sovereign text-muted-foreground">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* FAB menu — bottom right */}
      <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-end gap-2">
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-card shadow-boutique-hover p-1.5 mb-1 flex flex-col min-w-[130px]"
          >
            <button
              onClick={() => { setMenuOpen(false); navigate('/home'); }}
              className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <Home size={14} className="text-foreground" />
              <span className="font-sans text-[10px] text-foreground">Home</span>
            </button>
            <div className="h-px bg-border mx-2" />
            <button
              onClick={() => { setMenuOpen(false); navigate('/auth'); }}
              className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <User size={14} className="text-foreground" />
              <span className="font-sans text-[10px] text-foreground">Account</span>
            </button>
          </motion.div>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMenuOpen((v) => !v)}
          className="w-11 h-11 bg-primary shadow-boutique-hover flex items-center justify-center cursor-pointer border-none"
          aria-label="Menu"
        >
          <User size={16} className="text-primary-foreground" />
        </motion.button>
      </div>
    </div>
  );
};

export default QuickActions;
