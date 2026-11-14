import { describe, expect, it } from 'vitest';
import { HIDDEN_VOTE } from '../types';
import { createRoom, nextUnestimatedTaskId, roomReducer, viewFor, type RoomAction } from './roomReducer';

const host = { id: 'h', nick: 'Host', isHost: true };
const alice = { id: 'a', nick: 'Alice', isHost: false };

function run(...actions: RoomAction[]) {
  return actions.reduce(roomReducer, createRoom('ABC123', host));
}

describe('roomReducer', () => {
  it('adds participants and lets them rejoin with a new nick', () => {
    const s = run({ type: 'join', participant: alice }, { type: 'join', participant: { ...alice, nick: 'Ala' } });
    expect(s.participants.map((p) => p.nick)).toEqual(['Host', 'Ala']);
  });

  it('never removes the host on leave', () => {
    const s = run({ type: 'join', participant: alice }, { type: 'leave', participantId: 'h' }, { type: 'leave', participantId: 'a' });
    expect(s.participants.map((p) => p.id)).toEqual(['h']);
  });

  it('makes the first added task current', () => {
    const s = run(
      { type: 'addTask', task: { id: 't1', title: ' First ' } },
      { type: 'addTask', task: { id: 't2', title: 'Second' } },
      { type: 'addTask', task: { id: 't3', title: '   ' } },
    );
    expect(s.tasks.map((t) => t.title)).toEqual(['First', 'Second']);
    expect(s.currentTaskId).toBe('t1');
  });

  it('accepts votes only while voting and only from the deck', () => {
    const before = run({ type: 'join', participant: alice }, { type: 'vote', participantId: 'a', value: '5' });
    expect(before.voting.votes).toEqual({});

    const s = run(
      { type: 'join', participant: alice },
      { type: 'startVoting' },
      { type: 'vote', participantId: 'a', value: '5' },
      { type: 'vote', participantId: 'h', value: '999' },
      { type: 'vote', participantId: 'ghost', value: '3' },
    );
    expect(s.voting.votes).toEqual({ a: '5' });
  });

  it('resets voting when the current task changes', () => {
    const s = run(
      { type: 'addTask', task: { id: 't1', title: 'A' } },
      { type: 'addTask', task: { id: 't2', title: 'B' } },
      { type: 'startVoting' },
      { type: 'vote', participantId: 'h', value: '3' },
      { type: 'selectTask', taskId: 't2' },
    );
    expect(s.currentTaskId).toBe('t2');
    expect(s.voting).toEqual({ status: 'idle', votes: {} });
  });

  it('hides other votes until reveal', () => {
    const s = run({ type: 'join', participant: alice }, { type: 'startVoting' }, { type: 'vote', participantId: 'a', value: '5' }, { type: 'vote', participantId: 'h', value: '8' });
    expect(viewFor(s, 'a').voting.votes).toEqual({ a: '5', h: HIDDEN_VOTE });
    const revealed = roomReducer(s, { type: 'reveal' });
    expect(viewFor(revealed, 'a').voting.votes).toEqual({ a: '5', h: '8' });
  });

  it('finds the next task without an estimate', () => {
    const s = run(
      { type: 'addTask', task: { id: 't1', title: 'A' } },
      { type: 'addTask', task: { id: 't2', title: 'B', estimate: '3' } },
      { type: 'addTask', task: { id: 't3', title: 'C' } },
    );
    expect(nextUnestimatedTaskId(s)).toBe('t3');
    const done = roomReducer(s, { type: 'setEstimate', taskId: 't3', estimate: '5' });
    expect(nextUnestimatedTaskId(done)).toBeNull();
  });
});
