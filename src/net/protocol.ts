import type { RoomState } from '../types';

/** Prefix keeps our room ids from colliding with other apps on the public PeerJS server. */
const PEER_PREFIX = 'planning-poker-v1-';

export function peerIdForRoom(code: string): string {
  return PEER_PREFIX + code;
}

export type ClientMessage =
  | { type: 'join'; id: string; nick: string }
  | { type: 'vote'; value: string | null };

export type HostMessage = { type: 'state'; state: RoomState };

export const MAX_NICK_LENGTH = 24;

export function sanitizeNick(nick: string): string {
  return nick.trim().slice(0, MAX_NICK_LENGTH);
}

export function parseClientMessage(data: unknown): ClientMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const msg = data as Record<string, unknown>;
  if (msg.type === 'join' && typeof msg.id === 'string' && typeof msg.nick === 'string') {
    const nick = sanitizeNick(msg.nick);
    if (!nick || msg.id.length === 0 || msg.id.length > 64) return null;
    return { type: 'join', id: msg.id, nick };
  }
  if (msg.type === 'vote' && (typeof msg.value === 'string' || msg.value === null)) {
    return { type: 'vote', value: msg.value };
  }
  return null;
}

export function parseHostMessage(data: unknown): HostMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const msg = data as Record<string, unknown>;
  if (msg.type === 'state' && typeof msg.state === 'object' && msg.state !== null) {
    return { type: 'state', state: msg.state as RoomState };
  }
  return null;
}
