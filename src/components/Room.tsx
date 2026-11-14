import { useState } from 'react';
import type { RoomConnection } from '../state/useRoom';
import type { RoomState } from '../types';
import DeckSettings from './DeckSettings';
import Hand from './Hand';
import PokerTable from './PokerTable';
import TaskList from './TaskList';

interface Props {
  room: RoomConnection;
  state: RoomState;
  nick: string;
  onLeave: () => void;
}

function roomLink(code: string) {
  return `${window.location.origin}${window.location.pathname}#/room/${code}`;
}

export default function Room({ room, state, nick, onLeave }: Props) {
  const { isHost, myId, dispatch, vote } = room;
  const [copied, setCopied] = useState(false);
  const currentTask = state.tasks.find((t) => t.id === state.currentTaskId) ?? null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink(state.code));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Skopiuj link do pokoju:', roomLink(state.code));
    }
  };

  const leave = () => {
    const question = isHost
      ? 'Zamknąć pokój? Wszyscy uczestnicy zostaną rozłączeni, a lista zadań usunięta.'
      : 'Opuścić pokój?';
    if (window.confirm(question)) onLeave();
  };

  return (
    <div className="room">
      <header className="topbar">
        <span className="brand">Planning Poker</span>
        <div className="room-code">
          <span className="muted small">Klucz pokoju</span>
          <strong>{state.code}</strong>
          <button className="btn small" onClick={copyLink}>
            {copied ? 'Skopiowano!' : 'Kopiuj link'}
          </button>
        </div>
        <div className="topbar-right">
          <span className="muted small">Graczy: {state.participants.length}</span>
          <span className="me">
            {nick}
            {isHost && <span className="badge">moderator</span>}
          </span>
          <button className="btn small ghost" onClick={leave}>
            {isHost ? 'Zamknij pokój' : 'Opuść'}
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="panel">
          <TaskList state={state} isHost={isHost} dispatch={dispatch} />
          {isHost && <DeckSettings deck={state.deck} dispatch={dispatch} />}
        </aside>

        <main className="table-zone">
          <PokerTable state={state} currentTask={currentTask} myId={myId} isHost={isHost} dispatch={dispatch} />
        </main>
      </div>

      <Hand
        values={state.deck.values}
        selected={state.voting.votes[myId] ?? null}
        status={state.voting.status}
        onSelect={vote}
      />
    </div>
  );
}
