/** Up to two letters: first letters of the first two words, or the first two letters of a single word. */
export function initials(nick: string): string {
  const words = nick.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

/** Stable, distinguishable color per nick. */
export function avatarColor(nick: string): string {
  let hash = 0;
  for (const ch of nick) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 55% 42%)`;
}
