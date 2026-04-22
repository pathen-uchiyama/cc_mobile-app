import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import SwapSuggestionsSheet from './SwapSuggestionsSheet';
import { CelebrationProvider } from '@/contexts/CelebrationContext';
import { CompanionProvider } from '@/contexts/CompanionContext';
import { JoyEventsProvider } from '@/contexts/JoyEventsContext';

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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CompanionProvider>
    <JoyEventsProvider>
      <CelebrationProvider>{children}</CelebrationProvider>
    </JoyEventsProvider>
  </CompanionProvider>
);

const renderSheet = (reason: 'rain' | 'manual') =>
  render(
    <Wrapper>
      <SwapSuggestionsSheet open onClose={() => {}} reason={reason} />
    </Wrapper>
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
      <Wrapper>
        <SwapSuggestionsSheet open onClose={() => {}} reason="rain" />
      </Wrapper>
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
      <Wrapper>
        <SwapSuggestionsSheet open onClose={() => {}} reason="manual" />
      </Wrapper>
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

  it('does not re-announce the focused button label or trigger the live region on focus during a pivot toggle', () => {
    // Open in rain so a rationale set is active and at least one option
    // has a describedby target.
    const { rerender } = renderSheet('rain');

    const buttons = getOptionButtons();
    expect(buttons.length).toBeGreaterThan(0);
    const target = buttons[0] as HTMLButtonElement;
    const labelBeforeFocus = target.getAttribute('aria-label');
    expect(labelBeforeFocus).toMatch(/min wait/);

    // Snapshot the live region BEFORE focusing — this is the baseline
    // "rationale-added" announcement from the rain mount.
    const liveBeforeFocus = getLiveRegion().textContent ?? '';
    expect(liveBeforeFocus).toMatch(/rationale/i);

    // Focus the option button. Focus alone must NOT mutate the live
    // region (no aria-live update on focus events) and must NOT change
    // the button's accessible name.
    act(() => {
      target.focus();
    });
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute('aria-label')).toBe(labelBeforeFocus);
    expect(getLiveRegion().textContent ?? '').toBe(liveBeforeFocus);

    // Now trigger a re-render with the SAME reason (simulates an internal
    // pivot-state update while the button is focused). The focused
    // button's aria-label must be byte-identical, and the live region
    // must NOT receive a duplicate announcement (since the rationale
    // set didn't change).
    rerender(
      <Wrapper>
        <SwapSuggestionsSheet open onClose={() => {}} reason="rain" />
      </Wrapper>
    );

    // Re-locate the same logical button by its (stable) aria-label —
    // it should be the SAME DOM node since React reconciles by key.
    const buttonsAfter = getOptionButtons();
    const targetAfter = buttonsAfter.find(
      (b) => b.getAttribute('aria-label') === labelBeforeFocus
    );
    expect(targetAfter).toBeDefined();
    expect(targetAfter!.getAttribute('aria-label')).toBe(labelBeforeFocus);
    expect(getLiveRegion().textContent ?? '').toBe(liveBeforeFocus);
  });
});