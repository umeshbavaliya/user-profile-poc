import { describe, it, expect } from 'vitest';
import { formatDob, normalizeDobForInput } from './App';

describe('formatDob', () => {
  it('formats ISO date to DD-MM-YYYY', () => {
    expect(formatDob('1990-01-02')).toBe('02-01-1990');
  });

  it('formats slash date to DD-MM-YYYY', () => {
    expect(formatDob('02/01/1990')).toBe('02-01-1990');
  });

  it('returns original on invalid date', () => {
    expect(formatDob('not-a-date')).toBe('not-a-date');
  });
});

describe('normalizeDobForInput', () => {
  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(normalizeDobForInput('02/01/1990')).toBe('1990-01-02');
  });

  it('returns empty string for invalid', () => {
    expect(normalizeDobForInput('bad-date')).toBe('');
  });
});
