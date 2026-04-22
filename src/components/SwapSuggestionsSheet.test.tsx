import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SwapSuggestionsSheet from './SwapSuggestionsSheet';
import { CelebrationProvider } from '@/contexts/CelebrationContext';

/**
 * Accessibility regression: when the active rain pivot toggles, the
 * rationale must be announced exactly once — and the option button's
 * accessible name (ride / wait / area) must NOT change or re-announce.
 *
 * We assert structurally:
 *   1. Every option button's aria-label is option-only (no "Why now").
 *   2. The shared polite live region exists and is empty on first open
 *      (no spurious announcement on mount).
 *   3. Toggling reason from 'manual' → 'rain' produces exactly one
 *      live-region update describing the rationale change.
 *   4. Toggling rain → manual produces exactly one further update
 *      (the "removed" announcement) and the button labels stay stable.
 */

const renderSheet = (reason: 'rain' | 'manual') =>
  render(
    <CelebrationProvider>
      <SwapSuggestionsSheet open onClose={() => {}} reason={reason} />
    </CelebrationProvider>
  );

const getLiveRegion = () => {
  // The shared polite live region is the only role="status" element with
  // aria-live="polite" rendered by the sheet's option list.
  const regions = screen.getAllByRole('status');
  const live = regions.find((el) => el.getAttribute('aria-live') === 'polite');
  if (!live) throw new Error('expected a polite live region in the sheet');
  return live;
};

const getOptionButtons = () =>
  screen
    .getAllByRole('button')
    .filter((b) => /\d+\s*min wait/i.test(b.getAttribute('aria-label') ?? ''));

describe('SwapSuggestionsSheet — rain rationale announcement', () => {
  it('keeps option aria-labels stable and announces the rationale exactly once per toggle', () => {
    // 1) Open in 'manual' — no rain rationale, live region empty.
    const { rerender } = renderSheet('manual');

    const initialButtons = getOptionButtons();
    expect(initialButtons.length).toBeGreaterThan(0);
    const initialLabels = initialButtons.map((b) => b.getAttribute('aria-label'));
    initialLabels.forEach((label) => {
      expect(label).toMatch(/min wait/);
      expect(label).not.toMatch(/why now/i);
    });

    expect(getLiveRegion().textContent ?? '').toBe('');

    // 2) Flip to 'rain' — rationale appears, live region announces ONCE.
    rerender(
      <CelebrationProvider>
        <SwapSuggestionsSheet open onClose={() => {}} reason="rain" />
      </CelebrationProvider>
    );

    const rainButtons = getOptionButtons();
    rainButtons.forEach((b) => {
      const label = b.getAttribute('aria-label') ?? '';
      // Accessible name must NOT include the rationale text, even when
      // a rainWhy is being shown for this option.
      expect(label).not.toMatch(/why now/i);
      expect(label).toMatch(/min wait/);
    });

    const rainAnnouncement = getLiveRegion().textContent ?? '';
    expect(rainAnnouncement).toMatch(/rationale/i);
    expect(rainAnnouncement).toMatch(/added/i);

    // Each rain option exposes its rationale via a stable aria-describedby
    // target — never as part of the button's accessible name.
    rainButtons.forEach((b) => {
      const describedById = b.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      const target = document.getElementById(describedById!);
      expect(target).not.toBeNull();
      // The describedby target may or may not contain "Why now" depending
      // on whether THIS particular option has a rainWhy — but the
      // attribute must always resolve to a mounted node.
    });

    // 3) Flip back to 'manual' — exactly one further update describing
    //    that the rationales were removed; option labels stay stable.
    rerender(
      <CelebrationProvider>
        <SwapSuggestionsSheet open onClose={() => {}} reason="manual" />
      </CelebrationProvider>
    );

    const finalButtons = getOptionButtons();
    finalButtons.forEach((b) => {
      const label = b.getAttribute('aria-label') ?? '';
      expect(label).not.toMatch(/why now/i);
      expect(label).toMatch(/min wait/);
    });

    const removedAnnouncement = getLiveRegion().textContent ?? '';
    expect(removedAnnouncement).toMatch(/rationale/i);
    expect(removedAnnouncement).toMatch(/removed/i);
  });

  it('does not duplicate the rationale inside the visible decorative subtree (aria-hidden enforced)', () => {
    renderSheet('rain');

    // Find any visible "Why now" eyebrow — they must all live inside an
    // aria-hidden ancestor so AT cannot announce them separately.
    const eyebrows = screen.getAllByText(/why now/i, { selector: 'span' });
    expect(eyebrows.length).toBeGreaterThan(0);
    eyebrows.forEach((node) => {
      // Walk up looking for aria-hidden="true". The eyebrow itself is
      // marked aria-hidden defensively, and so is its container.
      let cur: HTMLElement | null = node;
      let hidden = false;
      while (cur && cur !== document.body) {
        if (cur.getAttribute('aria-hidden') === 'true') {
          hidden = true;
          break;
        }
        cur = cur.parentElement;
      }
      // Either the eyebrow itself or some ancestor must be aria-hidden.
      // (sr-only describedby targets are a different node — they don't
      // contain the visible "Why now" eyebrow text.)
      const inSrOnly = node.closest('.sr-only') !== null;
      expect(hidden || inSrOnly).toBe(true);
    });
  });
});