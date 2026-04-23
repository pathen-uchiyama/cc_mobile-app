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

  // jsdom expands the `border` shorthand into long-hand properties on the
  // inline `style` attribute, so a substring match on the original token
  // string fails. We snapshot both the raw attribute and the long-hand
  // CSSOM to anchor on the unique gold-alpha fingerprint instead.
  const styleSnapshot = (el: HTMLElement): string => {
    const inline = (el.getAttribute('style') ?? '').replace(/\s+/g, ' ');
    const cssText = el.style.cssText.replace(/\s+/g, ' ');
    return `${inline} || ${cssText}`;
  };

  it('outer section uses BURNISHED_GOLD.borderWatching (gold @ 0.45)', () => {
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist') as HTMLElement;
    // borderWatching === '1.5px solid hsl(var(--gold) / 0.45)'. The 45%
    // gold alpha is unique to the watching border in this token, so it's
    // a safe fingerprint to anchor on across long-hand expansion.
    expect(styleSnapshot(section)).toMatch(/hsl\(var\(--gold\)\s*\/\s*0\.45\)/);
  });

  it('outer section uses BURNISHED_GOLD.glowWatching', () => {
    // box-shadow is preserved verbatim, so a direct substring match is fine.
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist') as HTMLElement;
    expect(styleSnapshot(section)).toContain(BURNISHED_GOLD.glowWatching);
  });

  it('outer section never reaches for the armed glow (would outshout an armed row inside)', () => {
    // The strip is a *collection* of watching rows. If it adopted the
    // stronger armed glow, an actual armed row inside would lose its
    // visual primacy. This negative assertion locks the hierarchy.
    renderStrip();
    const section = screen.getByLabelText('Lightning Lane watchlist') as HTMLElement;
    const snap = styleSnapshot(section);
    expect(snap).not.toContain(BURNISHED_GOLD.glowArmed);
    // borderArmed's fingerprint is gold @ 0.65 — must NOT appear.
    expect(snap).not.toMatch(/hsl\(var\(--gold\)\s*\/\s*0\.65\)/);
  });
});
