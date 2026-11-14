import { useState } from 'react';
import { nextUnestimatedTaskId, type RoomAction } from '../state/roomReducer';
import type { RoomState, Task } from '../types';
import { computeStats, formatNumber } from '../utils/stats';

interface Props {
  state: RoomState;
  currentTask: Task | null;
  isHost: boolean;
  dispatch: (action: RoomAction) => void;
}

/** Compact results shown in the middle of the table after the cards are revealed. */
export default function Results({ state, currentTask, isHost, dispatch }: Props) {
  const votes = Object.values(state.voting.votes);
  const stats = computeStats(votes, state.deck.values);
  const mostCommon = stats.distribution[0]?.[0] ?? '';
  const [estimate, setEstimate] = useState(stats.suggestion ?? mostCommon);
  const nextId = nextUnestimatedTaskId(state);
  const consensus = stats.distribution.length === 1 && votes.length > 1;

  const save = (goNext: boolean) => {
    if (!currentTask) return;
    dispatch({ type: 'setEstimate', taskId: currentTask.id, estimate });
    if (goNext && nextId) dispatch({ type: 'selectTask', taskId: nextId });
  };

  const revote = isHost && (
    <button className="btn" onClick={() => dispatch({ type: 'startVoting' })}>
      Głosuj ponownie
    </button>
  );

  if (votes.length === 0) {
    return (
      <div className="results">
        <span className="felt-muted">Nikt nie zagłosował.</span>
        {revote}
      </div>
    );
  }

  return (
    <div className="results">
      <div className="results-stats">
        <div className="average">
          <span>Średnia</span>
          <strong>{stats.average === null ? '-' : formatNumber(stats.average)}</strong>
        </div>
        <div className="results-side">
          <div className="chips">
            {stats.distribution.map(([value, count]) => (
              <span key={value} className="chip" title={`${value}: ${count}`}>
                <span className="chip-card">{value}</span>&times;{count}
              </span>
            ))}
          </div>
          {stats.min !== null && stats.max !== null && stats.min !== stats.max && (
            <span className="felt-muted small">
              min {formatNumber(stats.min)} / max {formatNumber(stats.max)}
            </span>
          )}
          {consensus && <span className="consensus">Jednomyślnie!</span>}
        </div>
      </div>

      {isHost && (
        <div className="row center">
          {revote}
          {currentTask && (
            <>
              <input
                className="estimate-input"
                aria-label="Estymata zadania"
                value={estimate}
                maxLength={12}
                onChange={(e) => setEstimate(e.target.value)}
              />
              <button className="btn" onClick={() => save(false)}>
                Zapisz
              </button>
              {nextId && (
                <button className="btn primary" onClick={() => save(true)}>
                  Zapisz i następne
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
