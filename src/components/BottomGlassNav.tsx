import { Eye, Star, Shuffle, LayoutDashboard, Zap } from 'lucide-react';

type TabId = 'today' | 'mustdo' | 'pivot' | 'lightning' | 'details';

interface BottomGlassNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /**
   * Live progress on the guest's Must-Do list. When provided, a small
   * yellow pill renders on the Must-Do tab showing `done/total` rides.
   * Pill goes solid-yellow once every Must-Do is complete.
   */
  mustDoProgress?: { done: number; total: number };
  /**
   * Tabs that need the guest's attention right now. Each receives a
   * magenta "needs-attention" dot in its top-right corner. Use this for
   * proactive nudges: a new pivot suggestion, a fresh booking opening,
   * a reservation entering its check-in window, etc.
   */
  attentionTabs?: Partial<Record<TabId, boolean>>;
}

const tabs: { id: TabId; label: string; icon: typeof Eye }[] = [
  { id: 'today',   label: 'Today',    icon: Eye },
  { id: 'mustdo',  label: 'Must-Do',  icon: Star },
  { id: 'pivot',   label: 'Pivot',    icon: Shuffle },
  { id: 'lightning', label: 'Lightning Lane', icon: Zap },
  { id: 'details', label: 'Reservations', icon: LayoutDashboard },
];

/**
 * Bottom nav — Deep Navy bar, white ink at rest, bright-yellow ink on
 * the active tab. Magenta "attention" dots layer on top of any tab that
 * has a pending nudge for the guest.
 */
const BottomGlassNav = ({
  activeTab,
  onTabChange,
  mustDoProgress,
  attentionTabs,
}: BottomGlassNavProps) => {
  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-[9998] glass-nav mx-auto max-w-[448px] rounded-2xl"
      aria-label="Park navigation"
    >
      <div className="flex items-center justify-around py-2 px-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showProgress =
            tab.id === 'mustdo' && mustDoProgress && mustDoProgress.total > 0;
          const isComplete =
            showProgress && mustDoProgress!.done >= mustDoProgress!.total;
          const needsAttention = !!attentionTabs?.[tab.id];

          // Active = bright yellow ink; inactive = white at ~78%.
          const inkColor = isActive
            ? 'hsl(var(--highlighter))'
            : 'hsl(0 0% 100% / 0.78)';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] px-3 py-1 cursor-pointer border-none rounded-xl bg-transparent transition-colors duration-200 hover:opacity-90"
              style={{ color: inkColor }}
              aria-label={
                showProgress
                  ? `${tab.label} — ${mustDoProgress!.done} of ${mustDoProgress!.total} complete${
                      needsAttention ? ' (needs attention)' : ''
                    }`
                  : `${tab.label}${needsAttention ? ' (needs attention)' : ''}`
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.9} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>

              {/* Underline accent for the active tab — yellow stripe under the label */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: '18px',
                    height: '2px',
                    background: 'hsl(var(--highlighter))',
                  }}
                />
              )}

              {/* Must-Do progress pill */}
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
                      ? 'hsl(var(--highlighter))'
                      : 'hsl(var(--primary))',
                    color: isComplete
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--highlighter))',
                    border: '1.5px solid hsl(var(--highlighter))',
                  }}
                >
                  {mustDoProgress!.done}/{mustDoProgress!.total}
                </span>
              )}

              {/* Attention dot — magenta. Sits opposite the progress pill so
                  Must-Do can show both at once without collision. */}
              {needsAttention && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 rounded-full"
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'hsl(316 95% 45%)',
                    boxShadow: '0 0 0 2px hsl(var(--primary)), 0 0 8px hsl(316 95% 55% / 0.7)',
                  }}
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
