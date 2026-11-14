import Peer, { type DataConnection, type PeerError } from 'peerjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseClientMessage, parseHostMessage, peerIdForRoom, type ClientMessage, type HostMessage } from '../net/protocol';
import { loadHostedRoom, saveHostedRoom } from '../storage';
import type { RoomState } from '../types';
import { createRoom, roomReducer, viewFor, type RoomAction } from './roomReducer';

export interface Session {
  role: 'host' | 'client';
  code: string;
  nick: string;
  participantId: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'closed' | 'error';

export interface RoomConnection {
  status: ConnectionStatus;
  error: string | null;
  state: RoomState | null;
  isHost: boolean;
  myId: string;
  /** Host-only room actions; ignored for clients. */
  dispatch: (action: RoomAction) => void;
  vote: (value: string | null) => void;
  retry: () => void;
}

const CONNECT_TIMEOUT_MS = 15000;
const HOST_ID_RETRIES = 10;
const HOST_ID_RETRY_MS = 2000;

function describePeerError(err: PeerError<string>, code: string): string {
  switch (err.type) {
    case 'unavailable-id':
      return `Pokój ${code} jest już otwarty (może w innej karcie lub przez inną osobę).`;
    case 'peer-unavailable':
      return `Nie znaleziono pokoju ${code}. Sprawdź kod lub poproś hosta o nowy.`;
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'Brak połączenia z serwerem sygnalizacyjnym. Sprawdź internet i spróbuj ponownie.';
    case 'browser-incompatible':
      return 'Ta przeglądarka nie obsługuje WebRTC.';
    default:
      return `Błąd połączenia: ${err.message}`;
  }
}

export function useRoom(session: Session): RoomConnection {
  const { role, code, nick, participantId } = session;
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [attempt, setAttempt] = useState(0);

  const applyRef = useRef<(action: RoomAction) => void>(() => {});
  const sendRef = useRef<(msg: ClientMessage) => void>(() => {});
  const idRetries = useRef(0);

  useEffect(() => {
    setStatus('connecting');
    setError(null);
    const fail = (message: string) => {
      setError(message);
      setStatus('error');
    };

    if (role === 'host') {
      const me = { id: participantId, nick, isHost: true };
      const restored = loadHostedRoom(code);
      // Guests from a previous run reconnect on their own, so start with just the host.
      let current: RoomState = restored
        ? { ...restored, participants: [me], voting: { status: restored.voting.status, votes: {} } }
        : createRoom(code, me);

      const peer = new Peer(peerIdForRoom(code));
      const conns = new Map<DataConnection, string | null>();

      const commit = (next: RoomState) => {
        current = next;
        setState(next);
        saveHostedRoom(next);
        for (const [conn, pid] of conns) {
          if (pid && conn.open) conn.send({ type: 'state', state: viewFor(next, pid) } satisfies HostMessage);
        }
      };
      applyRef.current = (action) => commit(roomReducer(current, action));

      // Release the room id right away on reload/close so the next page load can claim it.
      const release = () => peer.destroy();
      window.addEventListener('pagehide', release);

      let opened = false;
      let retryTimer: number | undefined;
      peer.on('open', () => {
        opened = true;
        idRetries.current = 0;
        setStatus('connected');
        commit(current);
      });
      peer.on('connection', (conn) => {
        conns.set(conn, null);
        conn.on('data', (raw) => {
          const msg = parseClientMessage(raw);
          if (!msg) return;
          if (msg.type === 'join') {
            if (msg.id === participantId) return; // nobody may impersonate the host
            conns.set(conn, msg.id);
            applyRef.current({ type: 'join', participant: { id: msg.id, nick: msg.nick, isHost: false } });
            // Make sure the newcomer gets a state even if the join changed nothing.
            if (conn.open) conn.send({ type: 'state', state: viewFor(current, msg.id) } satisfies HostMessage);
          } else {
            const pid = conns.get(conn);
            if (pid) applyRef.current({ type: 'vote', participantId: pid, value: msg.value });
          }
        });
        const drop = () => {
          const pid = conns.get(conn);
          if (!conns.delete(conn) || !pid) return;
          // The same participant may have reconnected on another connection already.
          if (![...conns.values()].includes(pid)) applyRef.current({ type: 'leave', participantId: pid });
        };
        conn.on('close', drop);
        conn.on('error', drop);
      });
      // Losing the signaling server does not break existing data connections; just reconnect.
      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') return;
        // After a refresh the signaling server may still hold our previous id for a few seconds.
        if (err.type === 'unavailable-id' && restored && idRetries.current < HOST_ID_RETRIES) {
          idRetries.current += 1;
          retryTimer = window.setTimeout(() => setAttempt((n) => n + 1), HOST_ID_RETRY_MS);
          return;
        }
        if (!opened || err.type === 'unavailable-id') fail(describePeerError(err, code));
      });

      return () => {
        window.clearTimeout(retryTimer);
        window.removeEventListener('pagehide', release);
        applyRef.current = () => {};
        peer.destroy();
      };
    }

    const peer = new Peer();
    const release = () => peer.destroy();
    window.addEventListener('pagehide', release);
    let connected = false;
    const timeout = window.setTimeout(() => {
      if (!connected) fail(`Nie udało się połączyć z pokojem ${code} (przekroczono czas).`);
    }, CONNECT_TIMEOUT_MS);

    peer.on('open', () => {
      const conn = peer.connect(peerIdForRoom(code), { reliable: true });
      sendRef.current = (msg) => {
        if (conn.open) conn.send(msg);
      };
      conn.on('open', () => conn.send({ type: 'join', id: participantId, nick } satisfies ClientMessage));
      conn.on('data', (raw) => {
        const msg = parseHostMessage(raw);
        if (!msg) return;
        connected = true;
        setState(msg.state);
        setStatus('connected');
      });
      conn.on('close', () => {
        if (connected) setStatus('closed');
      });
    });
    peer.on('error', (err) => {
      if (!connected) fail(describePeerError(err, code));
      else if (err.type === 'peer-unavailable') setStatus('closed');
    });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('pagehide', release);
      sendRef.current = () => {};
      peer.destroy();
    };
  }, [role, code, nick, participantId, attempt]);

  const dispatch = useCallback((action: RoomAction) => applyRef.current(action), []);
  const vote = useCallback(
    (value: string | null) => {
      if (role === 'host') applyRef.current({ type: 'vote', participantId, value });
      else sendRef.current({ type: 'vote', value });
    },
    [role, participantId],
  );
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, error, state, isHost: role === 'host', myId: participantId, dispatch, vote, retry };
}
