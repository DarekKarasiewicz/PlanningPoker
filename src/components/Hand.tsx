import type { CSSProperties } from 'react';
import type { VotingStatus } from '../types';

interface Props {
  values: string[];
  selected: string | null;
  status: VotingStatus;
  onSelect: (value: string | null) => void;
}

const MAX_SPREAD_DEG = 7;
const MAX_FAN_DEG = 70;

/** The voting deck held "in hand": a fan of cards fixed to the bottom of the screen. */
export default function Hand({ values, selected, status, onSelect }: Props) {
  const enabled = status === 'voting';
  const n = values.length;
  const middle = (n - 1) / 2;
  const spread = Math.min(MAX_SPREAD_DEG, MAX_FAN_DEG / Math.max(n - 1, 1));

  let hint = 'Wybierz kartę (kliknij ponownie, aby cofnąć)';
  if (status === 'idle') hint = 'Głosowanie jeszcze się nie zaczęło';
  else if (status === 'revealed') hint = 'Karty odkryte';

  return (
    <div className={`hand ${enabled ? '' : 'hand-disabled'}`} style={{ '--n': n } as CSSProperties}>
      <div className="hand-hint">{hint}</div>
      <div className="hand-cards">
        {values.map((value, i) => {
          const offset = i - middle;
          // Outer cards sit lower so the hand forms an arc; 0 in the middle, 1 at the ends.
          const drop = middle > 0 ? (offset / middle) ** 2 : 0;
          const style = { '--rot': `${offset * spread}deg`, '--drop-k': drop } as CSSProperties;
          return (
            <button
              key={value}
              className={`hand-card ${selected === value ? 'selected' : ''}`}
              style={style}
              disabled={!enabled}
              aria-pressed={selected === value}
              aria-label={`Karta ${value}`}
              onClick={() => onSelect(selected === value ? null : value)}
            >
              <span className="corner top">{value}</span>
              <span className="pip">{value}</span>
              <span className="corner bottom">{value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
