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

  it('mutates the live region exactly once per rain pivot toggle', async () => {
    // Mount in 'manual' so the live region starts empty and we can count
    // every subsequent mutation produced by toggles.
    const { rerender } = renderSheet('manual');
    const live = getLiveRegion();

    // Record every text-content change to the live region. Each entry
    // corresponds to one potential screen-reader announcement.
    const updates: string[] = [];
    const observer = new MutationObserver(() => {
      updates.push(live.textContent ?? '');
    });
    observer.observe(live, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    try {
      // Toggle 1: manual → rain. Expect exactly one mutation that
      // contains the "added" rationale phrase.
      await act(async () => {
        rerender(
          <Wrapper>
            <SwapSuggestionsSheet open onClose={() => {}} reason="rain" />
          </Wrapper>
        );
      });
      expect(updates.length).toBe(1);
      expect(updates[0]).toMatch(/rationale/i);
      expect(updates[0]).toMatch(/added/i);

      // Toggle 2: rain → manual. Expect exactly one MORE mutation
      // (total = 2) describing the removal.
      await act(async () => {
        rerender(
          <Wrapper>
            <SwapSuggestionsSheet open onClose={() => {}} reason="manual" />
          </Wrapper>
        );
      });
      expect(updates.length).toBe(2);
      expect(updates[1]).toMatch(/rationale/i);
      expect(updates[1]).toMatch(/removed/i);

      // Toggle 3 (idempotency check): re-render with the SAME reason.
      // The rationale set didn't change, so the live region must NOT
      // mutate again — count stays at 2.
      await act(async () => {
        rerender(
          <Wrapper>
            <SwapSuggestionsSheet open onClose={() => {}} reason="manual" />
          </Wrapper>
        );
      });
      expect(updates.length).toBe(2);
    } finally {
      observer.disconnect();
    }
  });

  it('handles rapid rain pivot on/off toggling with one coherent announcement per transition (no duplication)', async () => {
    // Stress: flip reason between 'manual' and 'rain' many times in
    // quick succession. Each ON transition must produce exactly one
    // "added" announcement; each OFF transition exactly one "removed";
    // no transition may emit two announcements, and idempotent re-renders
    // (same reason twice in a row) must emit zero.
    const { rerender } = renderSheet('manual');
    const live = getLiveRegion();

    const updates: string[] = [];
    const observer = new MutationObserver(() => {
      updates.push(live.textContent ?? '');
    });
    observer.observe(live, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    // Sequence: rapid alternation, then a couple of idempotent repeats
    // sprinkled in to prove they don't add noise.
    const sequence: Array<'rain' | 'manual'> = [
      'rain', 'manual', 'rain', 'manual', 'rain', 'manual', 'rain', 'manual',
      'rain', 'rain',     // idempotent — no new announcement
      'manual', 'manual', // idempotent — no new announcement
      'rain', 'manual', 'rain', 'manual',
    ];

    // Compute the expected announcement pattern from the sequence by
    // diffing the rationale "active" state against the previous step.
    const expected: Array<'added' | 'removed'> = [];
    let prevActive = false; // we started in 'manual'
    for (const step of sequence) {
      const nextActive = step === 'rain';
      if (nextActive !== prevActive) {
        expected.push(nextActive ? 'added' : 'removed');
      }
      prevActive = nextActive;
    }

    try {
      for (const step of sequence) {
        await act(async () => {
          rerender(
            <Wrapper>
              <SwapSuggestionsSheet open onClose={() => {}} reason={step} />
            </Wrapper>
          );
        });
      }

      // Total mutation count must equal the number of REAL transitions —
      // never more (no duplicates), never fewer (no missed announcements).
      expect(updates.length).toBe(expected.length);

      // Each announcement must match its expected polarity AND mention
      // "rationale" so it reads coherently to a screen reader.
      updates.forEach((text, i) => {
        expect(text).toMatch(/rationale/i);
        expect(text.toLowerCase()).toContain(expected[i]);
      });

      // Independent symmetry check: equal counts of added/removed since
      // the sequence starts AND ends in 'manual' (rationale-off).
      const addedCount = updates.filter((t) => /added/i.test(t)).length;
      const removedCount = updates.filter((t) => /removed/i.test(t)).length;
      expect(addedCount).toBe(removedCount);

      // Final state is 'manual' → live region's last value must reflect
      // a "removed" announcement, never a stale "added" one.
      expect(updates[updates.length - 1]).toMatch(/removed/i);
    } finally {
      observer.disconnect();
    }
  });
});