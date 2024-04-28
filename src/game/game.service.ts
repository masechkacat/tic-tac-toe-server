import { Injectable } from '@nestjs/common';
import {
  Game,
  GameStatus,
  MoveResult,
  PlayerId,
  PlayerSymbol,
} from './game.types';
import { winningCombos } from './game.const';

/**
 * Service responsible for managing tic-tac-toe games.
 */
@Injectable()
export class GameService {
  private games = new Map<PlayerId, Game>();
  private waitingPlayers = new Set<PlayerId>();

  /**
   * Adds a player to the game.
   * If there is a waiting player, it starts a game between the waiting player and the new player.
   * If there is no waiting player, it adds the player to the waiting list.
   * @param clientId The ID of the player to add.
   * @returns The started game if there was a waiting player, otherwise returns 'waiting'.
   */
  addPlayer(clientId: PlayerId): Game | string {
    if (this.waitingPlayers.size > 0) {
      const opponentId = Array.from(this.waitingPlayers.values()).pop();
      this.waitingPlayers.delete(opponentId);
      return this.startGame(opponentId, clientId);
    } else {
      this.waitingPlayers.add(clientId);
      return 'waiting';
    }
  }

  /**
   * Starts a game between two players.
   * @param client1Id The ID of the first player.
   * @param client2Id The ID of the second player.
   * @returns The started game.
   */
  startGame(client1Id: PlayerId, client2Id: PlayerId) {
    const game: Game = {
      players: [
        { clientId: client1Id, symbol: PlayerSymbol.X },
        { clientId: client2Id, symbol: PlayerSymbol.O },
      ],
      board: Array(9).fill(null),
      currentPlayer: client1Id,
      gameOver: false,
    };
    this.games.set(client1Id, game);
    this.games.set(client2Id, game);

    this.waitingPlayers.delete(client1Id);
    this.waitingPlayers.delete(client2Id);
    return game;
  }

  /**
   * Makes a move for a player in the game.
   * @param clientId The ID of the player making the move.
   * @param index The index of the cell where the move is made.
   * @returns The move result, including the game status, updated board, current player, and player IDs.
   */
  makeMove(clientId: PlayerId, index: number): MoveResult {
    const game = this.games.get(clientId);
    if (!this.canMakeMove(game, clientId, index)) {
      return null;
    }
    this.updateBoardAndSwitchPlayer(game, clientId, index);
    const status = this.getGameStatus(game);
    const playerIds = game.players.map((player) => player.clientId);
    return {
      status,
      board: game.board,
      currentPlayer: game.currentPlayer,
      playerIds,
    };
  }

  /**
   * Removes a player from the game.
   * @param clientId The ID of the player to remove.
   */
  removePlayer(clientId: PlayerId) {
    this.games.delete(clientId);
    this.waitingPlayers.delete(clientId);
  }

  private getGameStatus(game: Game): GameStatus {
    if (this.checkWin(game.board)) {
      game.gameOver = true;
      return GameStatus.Win;
    } else if (this.checkDraw(game.board)) {
      game.gameOver = true;
      return GameStatus.Draw;
    } else {
      return GameStatus.Continue;
    }
  }

  private updateBoardAndSwitchPlayer(
    game: Game,
    clientId: PlayerId,
    index: number,
  ): void {
    game.board[index] = game.players.find(
      (player) => player.clientId === clientId,
    ).symbol;
    game.currentPlayer = game.players.find(
      (player) => player.clientId !== clientId,
    ).clientId;
  }

  private canMakeMove(game: Game, clientId: PlayerId, index: number): boolean {
    return (
      game &&
      game.board[index] === null &&
      game.currentPlayer === clientId &&
      !game.gameOver
    );
  }

  private checkDraw(board: (PlayerSymbol | null)[]): boolean {
    return board.every((cell) => cell !== null);
  }

  private checkWin(board: (PlayerSymbol | null)[]): boolean {
    return winningCombos.some((combo) => {
      return (
        combo.every((index) => board[index] === PlayerSymbol.X) ||
        combo.every((index) => board[index] === PlayerSymbol.O)
      );
    });
  }
}
