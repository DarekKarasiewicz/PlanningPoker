import { useEffect, useRef } from 'react';
import { useRoom, type Session } from '../state/useRoom';
import Room from './Room';

/** A host refresh drops guests for a moment, so guests keep retrying for a while. */
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECTS = 20;

interface Props {
  session: Session;
  onLeave: () => void;
}

export default function RoomScreen({ session, onLeave }: Props) {
  const room = useRoom(session);
  const { status, retry } = room;
  const wasConnected = useRef(false);
  const reconnects = useRef(0);

  useEffect(() => {
    if (status === 'connected') {
      wasConnected.current = true;
      reconnects.current = 0;
      return;
    }
    // Retry only rooms we were already in; a wrong code should fail straight away.
    const lost = status === 'closed' || (status === 'error' && wasConnected.current);
    if (!lost || reconnects.current >= MAX_RECONNECTS) return;
    const timer = window.setTimeout(() => {
      reconnects.current += 1;
      retry();
    }, RECONNECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, retry]);

  if (room.status === 'connected' && room.state) {
    return <Room room={room} state={room.state} nick={session.nick} onLeave={onLeave} />;
  }

  let title = session.role === 'host' ? 'Otwieranie pokoju...' : `Trwa łączenie z pokojem ${session.code}...`;
  let message: string | null = null;
  if (room.status === 'error') {
    title = 'Nie udało się połączyć';
    message = room.error;
  } else if (room.status === 'closed') {
    title = 'Połączenie z pokojem zostało przerwane';
    message = 'Host zamknął pokój albo stracił połączenie. Ponawiam próbę połączenia...';
  }
  const busy = room.status === 'connecting';

  return (
    <div className="lobby">
      <div className="lobby-card center-text">
        {busy && <div className="spinner" aria-hidden />}
        <h2>{title}</h2>
        {message && <p className="muted">{message}</p>}
        <div className="row center">
          {!busy && (
            <button className="btn primary" onClick={room.retry}>
              Spróbuj ponownie
            </button>
          )}
          <button className="btn" onClick={onLeave}>
            Wróć
          </button>
        </div>
      </div>
    </div>
  );
}
