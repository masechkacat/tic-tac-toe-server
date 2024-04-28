import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let gameService: GameService;
  let mockSocket: Socket;
  let server: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameGateway, GameService],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    gameService = module.get<GameService>(GameService);
    mockSocket = {
      id: 'testId',
      emit: jest.fn(),
    } as unknown as Socket;
    server = new Server();
    gateway.server = server;
  });

  it('should handle new connection', () => {
    jest.spyOn(gameService, 'addPlayer').mockReturnValue('waiting');
    jest.spyOn(mockSocket, 'emit');
    gateway.handleConnection(mockSocket);
    expect(gameService.addPlayer).toHaveBeenCalledWith(mockSocket.id);
    expect(mockSocket.emit).toHaveBeenCalledWith('message', {
      text: 'Waiting for an opponent...',
    });
  });

  it('should handle move', () => {
    const moveDto = { index: 1 };
    jest.spyOn(gameService, 'makeMove').mockReturnValue(null);

    // mock the return value of the 'to' method
    jest.spyOn(server, 'to').mockReturnValue({
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      rooms: new Set(),
      exceptRooms: new Set(),
      flags: {},
    } as any);

    jest.spyOn(server, 'emit');
    gateway.handleMove(mockSocket, moveDto);
    expect(gameService.makeMove).toHaveBeenCalledWith(
      mockSocket.id,
      moveDto.index,
    );
  });

  it('should handle disconnect', () => {
    jest.spyOn(gameService, 'removePlayer');
    jest.spyOn(server, 'emit');
    gateway.handleDisconnect(mockSocket);
    expect(gameService.removePlayer).toHaveBeenCalledWith(mockSocket.id);
    expect(server.emit).toHaveBeenCalledWith('gameOver', {
      text: 'Opponent disconnected. You win!',
    });
  });
});
