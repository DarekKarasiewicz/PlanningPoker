import { describe, expect, it } from 'vitest';
import { avatarColor, initials } from './avatar';

describe('initials', () => {
  it('uses first letters of the first two words', () => {
    expect(initials('jan kowalski')).toBe('JK');
    expect(initials('  Anna  Maria Nowak ')).toBe('AM');
  });

  it('uses two letters of a single word', () => {
    expect(initials('darek')).toBe('DA');
    expect(initials('X')).toBe('X');
  });

  it('falls back for an empty nick', () => {
    expect(initials('   ')).toBe('?');
  });
});

describe('avatarColor', () => {
  it('is stable for the same nick', () => {
    expect(avatarColor('Ala')).toBe(avatarColor('Ala'));
  });
});
