import { DEFAULT_DECK } from '../decks';
import { HIDDEN_VOTE, type Deck, type Participant, type RoomState, type Task, type Voting } from '../types';

export type RoomAction =
  | { type: 'join'; participant: Participant }
  | { type: 'leave'; participantId: string }
  | { type: 'vote'; participantId: string; value: string | null }
  | { type: 'addTask'; task: Task }
  | { type: 'removeTask'; taskId: string }
  | { type: 'selectTask'; taskId: string }
  | { type: 'startVoting' }
  | { type: 'reveal' }
  | { type: 'resetVoting' }
  | { type: 'setDeck'; deck: Deck }
  | { type: 'setEstimate'; taskId: string; estimate: string };

/** Actions a non-host participant is allowed to send to the host. */
export type ClientAction = Extract<RoomAction, { type: 'vote' }>;

export function createRoom(code: string, host: Participant): RoomState {
  return {
    code,
    deck: DEFAULT_DECK,
    participants: [{ ...host, isHost: true }],
    tasks: [],
    currentTaskId: null,
    voting: { status: 'idle', votes: {} },
  };
}

const idleVoting = (): Voting => ({ status: 'idle', votes: {} });

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'join': {
      const exists = state.participants.some((p) => p.id === action.participant.id);
      const participants = exists
        ? state.participants.map((p) =>
            p.id === action.participant.id ? { ...p, nick: action.participant.nick } : p,
          )
        : [...state.participants, { ...action.participant, isHost: false }];
      return { ...state, participants };
    }
    case 'leave': {
      const votes = { ...state.voting.votes };
      delete votes[action.participantId];
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.participantId || p.isHost),
        voting: { ...state.voting, votes },
      };
    }
    case 'vote': {
      if (state.voting.status !== 'voting') return state;
      if (!state.participants.some((p) => p.id === action.participantId)) return state;
      const votes = { ...state.voting.votes };
      if (action.value === null) {
        delete votes[action.participantId];
      } else {
        if (!state.deck.values.includes(action.value)) return state;
        votes[action.participantId] = action.value;
      }
      return { ...state, voting: { ...state.voting, votes } };
    }
    case 'addTask': {
      const title = action.task.title.trim();
      if (!title) return state;
      const tasks = [...state.tasks, { ...action.task, title }];
      // The first task added becomes the current one automatically.
      return { ...state, tasks, currentTaskId: state.currentTaskId ?? action.task.id };
    }
    case 'removeTask': {
      const tasks = state.tasks.filter((t) => t.id !== action.taskId);
      if (state.currentTaskId !== action.taskId) return { ...state, tasks };
      return { ...state, tasks, currentTaskId: null, voting: idleVoting() };
    }
    case 'selectTask': {
      if (action.taskId === state.currentTaskId) return state;
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return { ...state, currentTaskId: action.taskId, voting: idleVoting() };
    }
    case 'startVoting':
      return { ...state, voting: { status: 'voting', votes: {} } };
    case 'reveal':
      if (state.voting.status !== 'voting') return state;
      return { ...state, voting: { ...state.voting, status: 'revealed' } };
    case 'resetVoting':
      return { ...state, voting: idleVoting() };
    case 'setDeck':
      if (action.deck.values.length === 0) return state;
      return { ...state, deck: action.deck, voting: idleVoting() };
    case 'setEstimate':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, estimate: action.estimate.trim() || undefined } : t,
        ),
      };
  }
}

/** State as seen by a given participant: other people's votes stay hidden until reveal. */
export function viewFor(state: RoomState, viewerId: string): RoomState {
  if (state.voting.status === 'revealed') return state;
  const votes: Record<string, string> = {};
  for (const [id, value] of Object.entries(state.voting.votes)) {
    votes[id] = id === viewerId ? value : HIDDEN_VOTE;
  }
  return { ...state, voting: { ...state.voting, votes } };
}

/** Next task without an estimate, searching forward (wrapping) from the current one. */
export function nextUnestimatedTaskId(state: RoomState): string | null {
  const idx = state.tasks.findIndex((t) => t.id === state.currentTaskId);
  const ordered = [...state.tasks.slice(idx + 1), ...state.tasks.slice(0, Math.max(idx, 0))];
  return ordered.find((t) => !t.estimate)?.id ?? null;
}
