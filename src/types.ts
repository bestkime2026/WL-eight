export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type PlayerType = 'player' | 'ai';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHand: Card[];
  aiHand: Card[];
  currentPlayer: PlayerType;
  currentSuit: Suit;
  winner: PlayerType | null;
  message: string;
  isChoosingSuit: boolean;
}
