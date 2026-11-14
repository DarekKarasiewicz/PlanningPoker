import { useState } from 'react';
import Lobby from './components/Lobby';
import RoomScreen from './components/RoomScreen';
import type { Session } from './state/useRoom';
import { clearHostedRoom, getParticipantId, loadHostedRoom, loadNick, saveNick } from './storage';
import { normalizeRoomCode } from './utils/id';

function readHashCode(): string | null {
  const match = window.location.hash.match(/^#\/room\/([A-Za-z0-9]+)/);
  return match ? normalizeRoomCode(match[1]) : null;
}

/** A refresh (or a shared link opened by someone with a saved nick) goes straight into the room. */
function initialSession(): Session | null {
  const code = readHashCode();
  const nick = loadNick();
  if (!code || !nick) return null;
  const participantId = getParticipantId();
  // Only the tab that created the room resumes as host; other tabs with the link join as guests.
  const hostedHere = loadHostedRoom(code)?.participants.some((p) => p.isHost && p.id === participantId);
  return { role: hostedHere ? 'host' : 'client', code, nick, participantId };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(initialSession);

  const start = (role: Session['role'], code: string, nick: string) => {
    saveNick(nick);
    window.history.replaceState(null, '', `#/room/${code}`);
    setSession({ role, code, nick, participantId: getParticipantId() });
  };

  const leave = () => {
    if (session?.role === 'host') clearHostedRoom();
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setSession(null);
  };

  if (!session) return <Lobby initialCode={readHashCode() ?? ''} initialNick={loadNick()} onStart={start} />;
  return <RoomScreen key={`${session.role}:${session.code}`} session={session} onLeave={leave} />;
}
