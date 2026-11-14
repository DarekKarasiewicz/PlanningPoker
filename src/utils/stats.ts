import { HALF } from '../decks';

export function toNumber(value: string): number | null {
  const normalized = value.trim().replace(HALF, '0.5').replace(',', '.');
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export interface VoteStats {
  average: number | null;
  min: number | null;
  max: number | null;
  numericCount: number;
  /** [value, count] sorted by count desc. */
  distribution: [string, number][];
  /** Smallest numeric deck value >= average. */
  suggestion: string | null;
}

export function computeStats(votes: string[], deckValues: string[] = []): VoteStats {
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
  const distribution = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const numbers = votes.map(toNumber).filter((n): n is number => n !== null);
  if (numbers.length === 0) {
    return { average: null, min: null, max: null, numericCount: 0, distribution, suggestion: null };
  }
  const average = numbers.reduce((s, n) => s + n, 0) / numbers.length;

  const suggestion =
    deckValues
      .map((v) => [v, toNumber(v)] as const)
      .filter((pair): pair is readonly [string, number] => pair[1] !== null && pair[1] >= average - 1e-9)
      .sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;

  return {
    average,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    numericCount: numbers.length,
    distribution,
    suggestion,
  };
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
