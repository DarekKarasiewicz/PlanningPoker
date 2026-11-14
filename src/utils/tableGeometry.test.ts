import { describe, expect, it } from 'vitest';
import { stadiumSeats } from './tableGeometry';

describe('stadiumSeats', () => {
  it('puts the first seat at the bottom center', () => {
    const [first] = stadiumSeats(5, 200, 100);
    expect(first.xPct).toBeCloseTo(50);
    expect(first.yPct).toBeCloseTo(100);
    expect(first.ny).toBeCloseTo(1);
  });

  it('places two players facing each other', () => {
    const [, second] = stadiumSeats(2, 200, 100);
    expect(second.xPct).toBeCloseTo(50);
    expect(second.yPct).toBeCloseTo(0);
    expect(second.ny).toBeCloseTo(-1);
  });

  it('keeps every seat on the table edge with a unit normal', () => {
    for (const [w, h] of [
      [300, 100],
      [100, 300],
    ]) {
      for (const s of stadiumSeats(9, w, h)) {
        expect(Math.hypot(s.nx, s.ny)).toBeCloseTo(1);
        expect(s.xPct).toBeGreaterThanOrEqual(-1e-9);
        expect(s.xPct).toBeLessThanOrEqual(100 + 1e-9);
        expect(s.yPct).toBeGreaterThanOrEqual(-1e-9);
        expect(s.yPct).toBeLessThanOrEqual(100 + 1e-9);
      }
    }
  });

  it('seats people on the straight sides of a tall table', () => {
    const seats = stadiumSeats(4, 100, 300);
    expect(seats[1].nx).toBeCloseTo(-1);
    expect(seats[3].nx).toBeCloseTo(1);
  });
});
