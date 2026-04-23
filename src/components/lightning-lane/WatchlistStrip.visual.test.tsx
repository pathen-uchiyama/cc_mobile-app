import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WatchlistStrip from './WatchlistStrip';
import { BURNISHED_GOLD } from '@/pages/BookLightningLane';
import { LL_INVENTORY } from '@/data/lightningLanes';
import type { WatchEntry } from '@/hooks/lightning-lane/useLLWatchlist';

/**
 * Cross-component invariant — the WatchlistStrip outer surface is one of
 * the canonical "watching collection" surfaces and MUST consume the
 * BURNISHED_GOLD pair, not a free-floating gold string. This test renders
 * the component and inspects the inline `style` attribute of the outer
 * <section>, so any drift in either the token or the consumer fails loudly.
 *
 * If you need to change the watching outline, change `BURNISHED_GOLD` —
 * then this test (and every other consumer) updates in lockstep.
 */
describe('WatchlistStrip — burnished-gold outline parity with /book-ll', () => {
  // Pick any real attraction so the row inside the strip renders without
  // throwing — we only care about the outer <section>'s inline style.
  const realAttraction = LL_INVENTORY[0];

  const baseEntry: WatchEntry = {
    attractionId: realAttraction.id,
    addedAtMin: 600,
    openAtMin: 660,
    status: 'watching',
  };

  const renderStrip = () =>
    render(
      <WatchlistStrip
        entries={[baseEntry]}
        nowMinutes={600}
        tier="manager"
        onUnwatch={vi.fn()}
        onBookNow={vi.fn()}
        onRearm={vi.fn()}
      />,
    );

  it('outer section uses BURNISHED_GOLD.borderWatching', () => {
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist');
    // React serializes inline borders as `border: <value>` in the style attr.
    expect(section.getAttribute('style')).toContain(BURNISHED_GOLD.borderWatching);
  });

  it('outer section uses BURNISHED_GOLD.glowWatching', () => {
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist');
    expect(section.getAttribute('style')).toContain(BURNISHED_GOLD.glowWatching);
  });

  it('outer section never reaches for the armed glow (would outshout an armed row inside)', () => {
    // The strip is a *collection* of watching rows. If it adopted the
    // stronger armed glow, an actual armed row inside would lose its
    // visual primacy. This negative assertion locks the hierarchy.
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist');
    expect(section.getAttribute('style')).not.toContain(BURNISHED_GOLD.glowArmed);
    expect(section.getAttribute('style')).not.toContain(BURNISHED_GOLD.borderArmed);
  });
});
