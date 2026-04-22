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

/**
 * Digital Plaid bottom nav.
 *
 * Active tab is a gold chip (`bg-secondary-container` + navy ink), the
 * editorial "park stamp" treatment. Inactive items render with
 * on-surface-variant ink, no underline, no spring dot.
 */
const BottomGlassNav = ({ activeTab, onTabChange }: BottomGlassNavProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[9998] glass-nav mx-auto max-w-[448px] rounded-xl">
      <div className="flex items-center justify-around py-2 px-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] px-3 py-1 cursor-pointer border-none rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-secondary-container text-primary'
                  : 'bg-transparent text-on-surface-variant hover:opacity-80',
              ].join(' ')}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomGlassNav;
export type { TabId };
