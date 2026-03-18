import { motion } from 'framer-motion';
import { Bath, TreePine, Mic, Heart } from 'lucide-react';

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
  const handlers: Record<string, () => void> = {
    bathroom: onBathroom,
    quiet: onQuietSpace,
    memory: onMemory,
    pulse: onPulse,
  };

  return (
    <div className="px-6 pb-8 pt-4">
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
    </div>
  );
};

export default QuickActions;
