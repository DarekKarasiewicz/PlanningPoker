import type { RoomState } from './types';
import { uid } from './utils/id';

// All storage access is best-effort: private mode or blocked storage must not break the app.
function read(key: string, storage: () => Storage = () => localStorage): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null, storage: () => Storage = () => localStorage) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    /* ignore */
  }
}

const tabStorage = () => sessionStorage;

const NICK_KEY = 'pp.nick';
const PARTICIPANT_KEY = 'pp.participantId';
const HOSTED_ROOM_KEY = 'pp.hostedRoom';

// The tab's own nick wins on refresh; the shared one only pre-fills the lobby in new tabs.
export const loadNick = () => read(NICK_KEY, tabStorage) ?? read(NICK_KEY) ?? '';
export function saveNick(nick: string) {
  write(NICK_KEY, nick, tabStorage);
  write(NICK_KEY, nick);
}

/** Per-tab id: a refreshed tab rejoins as the same participant, a second tab is someone new. */
export function getParticipantId(): string {
  let id = read(PARTICIPANT_KEY, tabStorage);
  if (!id) {
    id = uid();
    write(PARTICIPANT_KEY, id, tabStorage);
  }
  return id;
}

/** The host keeps the room state locally so the room survives a page refresh. */
export function loadHostedRoom(code: string): RoomState | null {
  const raw = read(HOSTED_ROOM_KEY);
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as RoomState;
    return state.code === code ? state : null;
  } catch {
    return null;
  }
}

export const saveHostedRoom = (state: RoomState) => write(HOSTED_ROOM_KEY, JSON.stringify(state));
export const clearHostedRoom = () => write(HOSTED_ROOM_KEY, null);
