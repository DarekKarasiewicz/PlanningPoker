import type { RoomAction } from '../state/roomReducer';
import type { RoomState, Task } from '../types';

interface Props {
  task: Task | null;
  state: RoomState;
  isHost: boolean;
  dispatch: (action: RoomAction) => void;
}

export default function CurrentTask({ task, state, isHost, dispatch }: Props) {
  const { status, votes } = state.voting;
  const voted = Object.keys(votes).length;
  const total = state.participants.length;
  // After reveal the results need the space, so the task header shrinks to the title only.
  const compact = status === 'revealed';

  let hint: string;
  if (status === 'idle') hint = isHost ? 'Gdy zespół będzie gotowy, rozpocznij głosowanie.' : 'Czekamy aż moderator rozpocznie głosowanie.';
  else if (status === 'voting') hint = `Głosowanie trwa: ${voted}/${total}`;
  else hint = 'Karty odkryte';

  return (
    <section className={`current-task ${compact ? 'compact' : ''}`}>
      {task ? (
        <>
          <h1 className="current-task-title" title={task.title}>
            {task.title}
          </h1>
          {task.description && !compact && (
            <p className="current-task-desc" title={task.description}>
              {task.description}
            </p>
          )}
          {task.estimate && <div className="estimate-pill">Estymata: {task.estimate}</div>}
        </>
      ) : (
        <h1 className="current-task-title felt-muted">
          {state.tasks.length === 0
            ? isHost
              ? 'Dodaj pierwsze zadanie'
              : 'Moderator nie dodał jeszcze zadań'
            : isHost
              ? 'Wybierz zadanie z listy'
              : 'Moderator nie wybrał zadania'}
        </h1>
      )}

      {!compact && <div className={`status status-${status}`}>{hint}</div>}

      {isHost && !compact && (
        <div className="row center">
          {status === 'idle' && (
            <button className="btn primary big" onClick={() => dispatch({ type: 'startVoting' })}>
              Rozpocznij głosowanie
            </button>
          )}
          {status === 'voting' && (
            <>
              <button className="btn primary big" onClick={() => dispatch({ type: 'reveal' })}>
                Odkryj karty
              </button>
              <button className="btn" onClick={() => dispatch({ type: 'resetVoting' })}>
                Anuluj
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
