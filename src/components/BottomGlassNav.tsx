import { Eye, Star, Shuffle } from 'lucide-react';

type TabId = 'today' | 'mustdo' | 'pivot';

interface BottomGlassNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /**
   * Live progress on the guest's Must-Do list. When provided, a small
   * gold pill renders on the Must-Do tab showing `done/total` rides.
   * Pill goes solid-gold once every Must-Do is complete.
   */
  mustDoProgress?: { done: number; total: number };
}

const tabs: { id: TabId; label: string; icon: typeof Eye }[] = [
  { id: 'today',  label: 'Today',    icon: Eye },
  { id: 'mustdo', label: 'Must-Do',  icon: Star },
  { id: 'pivot',  label: 'Pivot',    icon: Shuffle },
];

/**
 * Digital Plaid bottom nav.
 *
 * Active tab is a gold chip (`bg-secondary-container` + navy ink), the
 * editorial "park stamp" treatment. Inactive items render with
 * on-surface-variant ink, no underline, no spring dot.
 */
const BottomGlassNav = ({ activeTab, onTabChange, mustDoProgress }: BottomGlassNavProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[9998] glass-nav mx-auto max-w-[448px] rounded-xl">
      <div className="flex items-center justify-around py-2 px-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showProgress =
            tab.id === 'mustdo' && mustDoProgress && mustDoProgress.total > 0;
          const isComplete =
            showProgress && mustDoProgress!.done >= mustDoProgress!.total;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] px-3 py-1 cursor-pointer border-none rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-secondary-container text-primary shadow-boutique'
                  : 'bg-transparent text-on-surface-variant hover:opacity-80',
              ].join(' ')}
              aria-label={
                showProgress
                  ? `${tab.label} — ${mustDoProgress!.done} of ${mustDoProgress!.total} complete`
                  : tab.label
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>

              {showProgress && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-sans font-bold tabular-nums shadow-sm"
                  style={{
                    minWidth: '20px',
                    height: '15px',
                    padding: '0 5px',
                    fontSize: '9px',
                    lineHeight: 1,
                    background: isComplete
                      ? 'hsl(var(--gold))'
                      : 'hsl(var(--card))',
                    color: isComplete
                      ? 'hsl(var(--card))'
                      : 'hsl(var(--obsidian))',
                    border: '1px solid hsl(var(--gold))',
                  }}
                >
                  {mustDoProgress!.done}/{mustDoProgress!.total}
                </span>
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
