import { useState } from 'react';
import { PRESET_DECKS, parseCustomDeck } from '../decks';
import type { RoomAction } from '../state/roomReducer';
import type { Deck } from '../types';

interface Props {
  deck: Deck;
  dispatch: (action: RoomAction) => void;
}

const CUSTOM = '__custom__';

export default function DeckSettings({ deck, dispatch }: Props) {
  const isPreset = PRESET_DECKS.some((d) => d.name === deck.name);
  const [choice, setChoice] = useState(isPreset ? deck.name : CUSTOM);
  const [custom, setCustom] = useState(isPreset ? '' : deck.values.join(', '));

  const customValues = parseCustomDeck(custom);
  const pending: Deck | null =
    choice === CUSTOM
      ? customValues.length > 0
        ? { name: 'Własna', values: customValues }
        : null
      : (PRESET_DECKS.find((d) => d.name === choice) ?? null);
  const changed = pending !== null && pending.values.join('|') !== deck.values.join('|');

  return (
    <section className="deck-settings">
      <h2 className="panel-title">Talia kart</h2>
      <select value={choice} onChange={(e) => setChoice(e.target.value)}>
        {PRESET_DECKS.map((d) => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
        <option value={CUSTOM}>Własna...</option>
      </select>

      {choice === CUSTOM && (
        <label className="field">
          <span className="small muted">Wartości oddzielone przecinkami</span>
          <input value={custom} placeholder="np. 1, 2, 3, 5, 8, ?" onChange={(e) => setCustom(e.target.value)} />
        </label>
      )}

      {pending && (
        <div className="deck-preview">
          {pending.values.map((v) => (
            <span key={v} className="mini-card">
              {v}
            </span>
          ))}
        </div>
      )}

      <button className="btn wide" disabled={!changed} onClick={() => pending && dispatch({ type: 'setDeck', deck: pending })}>
        Ustaw talię
      </button>
      {changed && <small className="muted">Zmiana talii przerywa bieżące głosowanie.</small>}
    </section>
  );
}
