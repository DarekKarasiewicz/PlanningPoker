import { useState, type FormEvent } from 'react';
import { MAX_NICK_LENGTH, sanitizeNick } from '../net/protocol';
import type { Session } from '../state/useRoom';
import { generateRoomCode, normalizeRoomCode } from '../utils/id';

interface Props {
  initialCode: string;
  initialNick: string;
  onStart: (role: Session['role'], code: string, nick: string) => void;
}

export default function Lobby({ initialCode, initialNick, onStart }: Props) {
  const [nick, setNick] = useState(initialNick);
  const [code, setCode] = useState(initialCode);
  const [touched, setTouched] = useState(false);

  const cleanNick = sanitizeNick(nick);
  const cleanCode = normalizeRoomCode(code);
  const nickError = touched && !cleanNick ? 'Podaj nick, żeby inni wiedzieli kto głosuje.' : null;

  const create = () => {
    setTouched(true);
    if (cleanNick) onStart('host', generateRoomCode(), cleanNick);
  };

  const join = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (cleanNick && cleanCode) onStart('client', cleanCode, cleanNick);
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-logo" aria-hidden>
          <span className="mini-card">5</span>
          <span className="mini-card">8</span>
          <span className="mini-card">13</span>
        </div>
        <h1>Planning Poker</h1>
        <p className="muted">Estymujcie zadania razem z zespołem. Bez rejestracji, bez bazy danych.</p>

        <label className="field">
          <span>Twój nick</span>
          <input
            value={nick}
            maxLength={MAX_NICK_LENGTH}
            placeholder="np. Darek"
            autoFocus={!initialNick}
            onChange={(e) => setNick(e.target.value)}
          />
          {nickError && <small className="error-text">{nickError}</small>}
        </label>

        <div className="lobby-actions">
          <section>
            <h2>Nowy pokój</h2>
            <p className="muted small">Zostaniesz moderatorem: dodajesz zadania i prowadzisz głosowanie.</p>
            <button className="btn primary wide" onClick={create}>
              Utwórz pokój
            </button>
          </section>

          <div className="divider">
            <span>lub</span>
          </div>

          <form onSubmit={join}>
            <h2>Dołącz do pokoju</h2>
            <label className="field">
              <span>Klucz dostępu</span>
              <input
                value={code}
                placeholder="np. K7M2QX"
                className="code-input"
                maxLength={12}
                autoFocus={!!initialNick && !initialCode}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <button className="btn wide" type="submit" disabled={!cleanCode}>
              Dołącz
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
