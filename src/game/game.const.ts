export enum GameMessages {
  Waiting = 'Waiting for an opponent...',
  GameStartedX = "Game started! You are X and it's your turn.",
  GameStartedO = "Game started! You are O and it's your opponent's turn.",
  yourTurn = "It's your turn.",
  opponentTurn = "It's your opponent's turn.",
  YouWon = 'Congratulations, you won!',
  YouLost = 'Sorry, you lost.',
  Draw = "It's a draw.",
  Disconected = 'Opponent disconnected. You win!',
}

export const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];
