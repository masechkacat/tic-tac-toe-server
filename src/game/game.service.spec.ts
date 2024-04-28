import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { Game, PlayerId } from './game.types';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
    service['games'] = new Map<PlayerId, Game>();
    service['waitingPlayers'] = new Set<PlayerId>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPlayer', () => {
    it('should add a player to the waiting list if no opponent is available', () => {
      const clientId = 'player1';
      const result = service.addPlayer(clientId);
      expect(result).toBe('waiting');
      expect(service['waitingPlayers'].has(clientId)).toBe(true);
    });

    it('should start a game if an opponent is available', () => {
      const clientId1 = 'player1';
      const clientId2 = 'player2';
      const result1 = service.addPlayer(clientId1);
      expect(result1).toBe('waiting');
      const result2 = service.addPlayer(clientId2);
      expect(result2).not.toBe('waiting');
      expect(service['waitingPlayers'].has(clientId1)).toBe(false);
      expect(service['waitingPlayers'].has(clientId2)).toBe(false);
      expect(service['games'].has(clientId1)).toBe(true);
      expect(service['games'].has(clientId2)).toBe(true);
      expect(service['games'].get(clientId1).currentPlayer).toBe(clientId1);
    });
  });

  describe('startGame', () => {
    it('should start a game between two players', () => {
      const clientId1 = 'player1';
      const clientId2 = 'player2';
      const game = service.startGame(clientId1, clientId2);
      expect(game).toBeDefined();
      expect(game.players.length).toBe(2);
      expect(game.players[0].clientId).toBe(clientId1);
      expect(game.players[1].clientId).toBe(clientId2);
      expect(game.board.length).toBe(9);
      expect(game.currentPlayer).toBe(clientId1);
    });
  });

  describe('makeMove', () => {
    it('should return "draw" if the game is a draw', () => {
      const clientId1 = 'player1';
      const clientId2 = 'player2';
      service.addPlayer(clientId1);
      service.addPlayer(clientId2);
      service.makeMove(clientId1, 0);
      service.makeMove(clientId2, 1);
      service.makeMove(clientId1, 2);
      service.makeMove(clientId2, 3);
      service.makeMove(clientId1, 4);
      service.makeMove(clientId2, 6);
      service.makeMove(clientId1, 5);
      service.makeMove(clientId2, 8);
      const result = service.makeMove(clientId1, 7);
      expect(result).toBeDefined();
      expect(result.status).toBe('draw');
    });

    it('should return null if the move is invalid', () => {
      const clientId1 = 'player1';
      const clientId2 = 'player2';
      service.addPlayer(clientId1);
      service.addPlayer(clientId2);
      service.makeMove(clientId1, 0);
      const result = service.makeMove(clientId1, 0); // Invalid move: same player tries to move twice
      expect(result).toBeNull();
    });

    it('should return "win" if a player wins', () => {
      const clientId1 = 'player1';
      const clientId2 = 'player2';
      service.addPlayer(clientId1);
      service.addPlayer(clientId2);
      service.makeMove(clientId1, 0);
      service.makeMove(clientId2, 3);
      service.makeMove(clientId1, 1);
      service.makeMove(clientId2, 4);
      const result = service.makeMove(clientId1, 2);
      expect(result).toBeDefined();
      expect(result.status).toBe('win');
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from the game', () => {
      const clientId = 'player1';
      service.addPlayer(clientId);
      service.removePlayer(clientId);
      expect(service['games'].has(clientId)).toBe(false);
      expect(service['waitingPlayers'].has(clientId)).toBe(false);
    });
  });
});
