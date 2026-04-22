import { describe, it, expect } from 'vitest';
import { formatClockTime, PARK_TIMEZONE } from './lightningLanes';

/**
 * formatClockTime is the only path that produces user-facing wall clocks
 * for sell-out estimates. These tests pin the contract so a future refactor
 * can't quietly drift the displayed time across timezones.
 */
describe('formatClockTime — timezone-safe park-local output', () => {
  it('renders minutes since midnight as a 12-hour clock', () => {
    // Same viewer zone as park → no tag, just the wall clock.
    expect(formatClockTime(555, { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('9:15 AM');
    expect(formatClockTime(690, { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('11:30 AM');
    expect(formatClockTime(900, { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('3:00 PM');
    expect(formatClockTime(0,   { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('12:00 AM');
    expect(formatClockTime(720, { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('12:00 PM');
  });

  it('appends a short timezone tag when the viewer is in a different zone', () => {
    // Pacific viewer looking at Walt Disney World (Eastern) inventory.
    const out = formatClockTime(555, {
      parkZone: 'America/New_York',
      viewerZone: 'America/Los_Angeles',
    });
    expect(out).toBe('9:15 AM ET');
  });

  it('does not append a tag when viewer and park share a wall clock', () => {
    // Detroit observes Eastern just like New York.
    const out = formatClockTime(555, {
      parkZone: 'America/New_York',
      viewerZone: 'America/Detroit',
    });
    expect(out).toBe('9:15 AM');
  });

  it('clamps out-of-range inputs into the valid window', () => {
    expect(formatClockTime(-30,    { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('12:00 AM');
    expect(formatClockTime(99_999, { parkZone: PARK_TIMEZONE, viewerZone: PARK_TIMEZONE })).toBe('11:59 PM');
  });
});