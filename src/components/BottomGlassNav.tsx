import { motion } from 'framer-motion';
import { Eye, Map, Compass, Lock } from 'lucide-react';

type TabId = 'horizon' | 'canvas' | 'guide' | 'vault';

interface BottomGlassNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Eye }[] = [
  { id: 'horizon', label: 'Horizon', icon: Eye },
  { id: 'canvas', label: 'Canvas', icon: Map },
  { id: 'guide', label: 'Guide', icon: Compass },
  { id: 'vault', label: 'Vault', icon: Lock },
];

const BottomGlassNav = ({ activeTab, onTabChange }: BottomGlassNavProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[9998] glass-nav mx-auto max-w-[448px]">
      <div className="flex items-center justify-around py-3 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-1 min-w-[56px] min-h-[44px] justify-center bg-transparent border-none cursor-pointer"
              aria-label={tab.label}
            >
              <Icon
                size={22}
                className={`transition-colors duration-300 ${isActive ? 'text-obsidian' : 'text-slate-plaid'}`}
              />
              <span className={`font-sans text-[9px] uppercase tracking-sovereign transition-colors duration-300 ${isActive ? 'text-obsidian' : 'text-slate-plaid'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-gold"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomGlassNav;
export type { TabId };
