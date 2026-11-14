import type { Deck } from './types';

export const COFFEE = String.fromCharCode(0x2615);
export const HALF = String.fromCharCode(0x00bd);

export const PRESET_DECKS: Deck[] = [
  { name: 'Fibonacci', values: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?', COFFEE] },
  {
    name: 'Zmodyfikowany Fibonacci',
    values: ['0', HALF, '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', COFFEE],
  },
  { name: 'T-shirt', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', COFFEE] },
  { name: 'Potęgi 2', values: ['0', '1', '2', '4', '8', '16', '32', '64', '?', COFFEE] },
];

export const DEFAULT_DECK = PRESET_DECKS[0];

const MAX_CARDS = 30;
const MAX_CARD_LENGTH = 8;

/** Parses a custom deck from comma (or semicolon) separated values, e.g. "1, 2, 4, 8, ?". */
export function parseCustomDeck(input: string): string[] {
  const values = input
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= MAX_CARD_LENGTH);
  return Array.from(new Set(values)).slice(0, MAX_CARDS);
}
