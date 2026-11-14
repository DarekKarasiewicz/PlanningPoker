import { useState, type FormEvent } from 'react';
import type { RoomAction } from '../state/roomReducer';
import type { RoomState } from '../types';
import { uid } from '../utils/id';
import { toNumber } from '../utils/stats';

interface Props {
  state: RoomState;
  isHost: boolean;
  dispatch: (action: RoomAction) => void;
}

export default function TaskList({ state, isHost, dispatch }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  const estimated = state.tasks.filter((t) => t.estimate).length;
  const totalPoints = state.tasks.reduce((sum, t) => sum + (t.estimate ? (toNumber(t.estimate) ?? 0) : 0), 0);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch({
      type: 'addTask',
      task: { id: uid(), title: title.trim(), description: description.trim() || undefined },
    });
    setTitle('');
    setDescription('');
  };

  return (
    <section className="tasks">
      <h2 className="panel-title">
        Zadania <span className="muted">({state.tasks.length})</span>
      </h2>
      {state.tasks.length > 0 && (
        <div className="muted small">
          Oszacowane: {estimated}/{state.tasks.length}
          {totalPoints > 0 && <> &middot; Suma: {Math.round(totalPoints * 10) / 10}</>}
        </div>
      )}

      <ol className="task-list">
        {state.tasks.map((task) => {
          const active = task.id === state.currentTaskId;
          return (
            <li key={task.id} className={`task ${active ? 'task-active' : ''}`}>
              <button
                className="task-main"
                disabled={!isHost}
                title={isHost ? 'Ustaw jako aktualne zadanie' : undefined}
                onClick={() => dispatch({ type: 'selectTask', taskId: task.id })}
              >
                <span className="task-title">{task.title}</span>
                {task.estimate && <span className="estimate-pill small">{task.estimate}</span>}
              </button>
              {isHost && (
                <button
                  className="icon-btn"
                  aria-label={`Usuń zadanie ${task.title}`}
                  onClick={() => dispatch({ type: 'removeTask', taskId: task.id })}
                >
                  &times;
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {isHost && (
        <form className="add-task" onSubmit={add}>
          <input
            value={title}
            placeholder="Nowe zadanie / user story"
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
          {showDescription && (
            <textarea
              value={description}
              placeholder="Opis (opcjonalnie)"
              rows={3}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
          <div className="row">
            <button className="btn primary" type="submit" disabled={!title.trim()}>
              Dodaj
            </button>
            <button className="btn ghost small" type="button" onClick={() => setShowDescription((v) => !v)}>
              {showDescription ? 'Bez opisu' : '+ opis'}
            </button>
          </div>
          {/* TODO: import zadań z pliku Excel */}
          <button className="btn ghost small" type="button" disabled title="Wkrótce">
            Import z Excela (wkrótce)
          </button>
        </form>
      )}
    </section>
  );
}
