import { MapPin, Clock } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface NeedOverlayProps {
  type: 'bathroom' | 'quiet';
  onClose: () => void;
}

const BATHROOMS = [
  { name: 'Adventureland Restrooms', distance: '2 min walk', crowd: 'Low' },
  { name: 'Fantasyland Restrooms (near Storybook)', distance: '4 min walk', crowd: 'Moderate' },
  { name: 'Tomorrowland Restrooms', distance: '6 min walk', crowd: 'Low' },
];

const QUIET_SPACES = [
  { name: 'Tom Sawyer Island', distance: '5 min walk', note: 'Shaded benches, minimal foot traffic' },
  { name: 'Columbia Harbour House (upstairs)', distance: '3 min walk', note: 'Air conditioned, rarely crowded' },
  { name: 'The Tomorrowland Transit Authority', distance: '4 min walk', note: 'Sit down, gentle breeze, low stimulation' },
];

const NeedOverlay = ({ type, onClose }: NeedOverlayProps) => {
  const items = type === 'bathroom' ? BATHROOMS : QUIET_SPACES;
  const title = type === 'bathroom' ? 'Nearest Restrooms' : 'Quiet Spaces Nearby';
  const subtitle = type === 'bathroom'
    ? 'Sorted by proximity to your current location'
    : 'Low-stimulation zones for when you need a reset';

  return (
    <BottomSheet
      open={true}
      onClose={onClose}
      snap="half"
      eyebrow={type === 'bathroom' ? 'Nearby Relief' : 'Quiet Companion'}
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-card p-4 shadow-boutique rounded-xl">
            <h3 className="font-sans text-sm font-semibold text-foreground mb-2">{item.name}</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-muted-foreground" />
                <span className="font-sans text-[10px] text-muted-foreground">{item.distance}</span>
              </div>
              {'crowd' in item && (
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-muted-foreground" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    Crowd: <span className="text-foreground font-semibold">{item.crowd}</span>
                  </span>
                </div>
              )}
              {'note' in item && (
                <span className="font-sans text-[10px] text-muted-foreground italic">{item.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};

export default NeedOverlay;
