import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { RoomAction } from '../state/roomReducer';
import { HIDDEN_VOTE, type Participant, type RoomState, type Task, type VotingStatus } from '../types';
import { avatarColor, initials } from '../utils/avatar';
import { stadiumSeats, type SeatPoint } from '../utils/tableGeometry';
import CurrentTask from './CurrentTask';
import Results from './Results';

interface Props {
  state: RoomState;
  currentTask: Task | null;
  myId: string;
  isHost: boolean;
  dispatch: (action: RoomAction) => void;
}

/** Current user sits at the bottom (next to their hand), everyone else clockwise. */
function seatOrder(participants: Participant[], myId: string): Participant[] {
  const idx = participants.findIndex((p) => p.id === myId);
  if (idx < 0) return participants;
  return [...participants.slice(idx), ...participants.slice(0, idx)];
}

/** Seat positions depend on the table's real proportions, so track its size. */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 2, height: 1 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export default function PokerTable({ state, currentTask, myId, isHost, dispatch }: Props) {
  const seats = seatOrder(state.participants, myId);
  const { status, votes } = state.voting;
  const [tableRef, size] = useElementSize<HTMLDivElement>();
  const points = stadiumSeats(seats.length, size.width, size.height);

  return (
    <div className="table-area">
      <div className="poker-table" ref={tableRef}>
        <div className="table-felt">
          <div className="table-center">
            <CurrentTask task={currentTask} state={state} isHost={isHost} dispatch={dispatch} />
            {status === 'revealed' && (
              <Results state={state} currentTask={currentTask} isHost={isHost} dispatch={dispatch} />
            )}
          </div>
        </div>
        {seats.map((p, i) => (
          <Seat
            key={p.id}
            participant={p}
            point={points[i]}
            vote={votes[p.id]}
            status={status}
            isMe={p.id === myId}
          />
        ))}
      </div>
    </div>
  );
}

interface SeatProps {
  participant: Participant;
  /** Point on the table edge where this player sits. */
  point: SeatPoint;
  vote: string | undefined;
  status: VotingStatus;
  isMe: boolean;
}

function Seat({ participant, point, vote, status, isMe }: SeatProps) {
  const { nx, ny } = point;
  const seatStyle: CSSProperties = { left: `${point.xPct}%`, top: `${point.yPct}%` };
  // The played card lies on the felt, pushed from the seat towards the table center.
  const cardStyle: CSSProperties = {
    transform: `translate(calc(-50% + var(--push-x) * ${-nx}), calc(-50% + var(--push-y) * ${-ny}))`,
  };

  let card: JSX.Element | null = null;
  if (status === 'voting') {
    card = vote ? (
      <div className="table-card back" title={isMe && vote !== HIDDEN_VOTE ? `Twój głos: ${vote}` : 'Zagłosował(a)'} />
    ) : (
      <div className="table-card empty" title="Jeszcze nie głosował(a)" />
    );
  } else if (status === 'revealed') {
    card = vote ? <div className="table-card face">{vote}</div> : <div className="table-card empty">-</div>;
  }

  return (
    <div className={`seat ${ny < -0.2 ? 'seat-top' : ''} ${isMe ? 'seat-me' : ''}`} style={seatStyle}>
      {card && (
        <div className="seat-card" style={cardStyle}>
          {card}
        </div>
      )}
      <div className="seat-avatar" style={{ background: avatarColor(participant.nick) }} title={participant.nick}>
        {initials(participant.nick)}
        {participant.isHost && <span className="dealer-chip" title="Moderator" />}
      </div>
      <div className="seat-nick">
        {participant.nick}
        {isMe && ' (Ty)'}
      </div>
    </div>
  );
}
