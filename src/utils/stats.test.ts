import { describe, expect, it } from 'vitest';
import { COFFEE, HALF, PRESET_DECKS, parseCustomDeck } from '../decks';
import { computeStats, toNumber } from './stats';

describe('parseCustomDeck', () => {
  it('splits by comma, trims, dedupes and drops empties', () => {
    expect(parseCustomDeck(' 1, 2 ,, 4; 8, 2, ? ')).toEqual(['1', '2', '4', '8', '?']);
  });
});

describe('computeStats', () => {
  const fib = PRESET_DECKS[0].values;

  it('averages numeric votes and ignores ? and coffee', () => {
    const s = computeStats(['3', '5', '8', '?', COFFEE], fib);
    expect(s.average).toBeCloseTo(16 / 3);
    expect(s.numericCount).toBe(3);
    expect(s.min).toBe(3);
    expect(s.max).toBe(8);
    expect(s.suggestion).toBe('8');
  });

  it('handles half and decimal values', () => {
    expect(toNumber(HALF)).toBe(0.5);
    expect(toNumber('1.5')).toBe(1.5);
    expect(toNumber('XL')).toBeNull();
  });

  it('returns null average when no numeric votes', () => {
    const s = computeStats(['M', 'M', 'L']);
    expect(s.average).toBeNull();
    expect(s.distribution).toEqual([['M', 2], ['L', 1]]);
  });
});
