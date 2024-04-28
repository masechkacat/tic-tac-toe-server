export enum PlayerSymbol {
  X = 'X',
  O = 'O',
}

export enum GameStatus {
  Win = 'win',
  Draw = 'draw',
  Continue = 'continue',
}

export type PlayerId = string;

export type Player = {
  clientId: PlayerId;
  symbol: PlayerSymbol;
};

export type Game = {
  players: [Player, Player];
  board: (PlayerSymbol | null)[];
  currentPlayer: PlayerId;
  gameOver: boolean;
};

export type MoveResult = {
  status: GameStatus | null;
  board: PlayerSymbol[];
  currentPlayer: PlayerId;
  playerIds: PlayerId[];
} | null;
