export type VotingStatus = 'idle' | 'voting' | 'revealed';

export interface Participant {
  id: string;
  nick: string;
  isHost: boolean;
  /** Reserved for future avatar support. */
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  estimate?: string;
}

export interface Deck {
  name: string;
  values: string[];
}

export interface Voting {
  status: VotingStatus;
  /** participantId -> card value. Hidden values are sent as HIDDEN_VOTE before reveal. */
  votes: Record<string, string>;
}

export interface RoomState {
  code: string;
  deck: Deck;
  participants: Participant[];
  tasks: Task[];
  currentTaskId: string | null;
  voting: Voting;
}

export const HIDDEN_VOTE = '*';
