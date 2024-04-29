import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from './game.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { MoveDto } from './dto/game-event.dto';
import { Game, GameStatus } from './game.types';
import { GameMessages } from './game.const';

/**
 * @WebSocketGateway is a decorator that declares this class as a WebSocket gateway.
 * The options object passed to it specifies the CORS policy for this gateway.
 *
 * @WebSocketServer is a decorator that injects the server instance.
 *
 * @UsePipes is a decorator that binds the ValidationPipe to the handleMove method.
 * This pipe validates the incoming data.
 *
 * @SubscribeMessage('move') is a decorator that binds the handleMove method to the 'move' event.
 *
 * @ConnectedSocket is a decorator that injects the connected client instance.
 *
 * @MessageBody is a decorator that injects the client-sent data transferred within the message.
 */
@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private gameService: GameService) {}

  /**
   * This method is triggered when a new client connects to the server.
   * It logs the client id and adds the player to the game.
   * If the game status is 'waiting', it sends a 'Waiting' message to the client.
   * If the game has started, it sends a 'Game Started' message to all players.
   *
   * @param client - The connected socket client.
   */
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const gameStatus = this.gameService.addPlayer(client.id);
    if (gameStatus === 'waiting') {
      client.emit('message', { text: GameMessages.Waiting });
    } else {
      const game = gameStatus as Game;
      game.players.forEach((player) => {
        const message =
          player.clientId === client.id
            ? GameMessages.GameStartedO
            : GameMessages.GameStartedX;
        this.server.to(player.clientId).emit('message', { text: message });
      });
    }
  }

  /**
   * This method is triggered when a client makes a move.
   * It validates the move data, makes the move, and sends game updates to all players.
   * If an error occurs, it sends an error message to the client.
   *
   * @param client - The connected socket client.
   * @param data - The move data.
   */
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('move')
  handleMove(@ConnectedSocket() client: Socket, @MessageBody() data: MoveDto) {
    try {
      const result = this.gameService.makeMove(client.id, data.index);
      console.log(result);
      if (result) {
        result.playerIds.forEach((playerId) => {
          this.server.to(playerId).emit('gameUpdated', { result });
          if (result.currentPlayer === playerId) {
            this.server
              .to(playerId)
              .emit('message', { text: GameMessages.yourTurn });
          } else {
            this.server
              .to(playerId)
              .emit('message', { text: GameMessages.opponentTurn });
          }
          if (result.status === GameStatus.Win) {
            const message =
              playerId === client.id
                ? GameMessages.YouWon
                : GameMessages.YouLost;
            this.server.to(playerId).emit('gameOver', { text: message });
          } else if (result.status === GameStatus.Draw) {
            this.server
              .to(playerId)
              .emit('gameOver', { text: GameMessages.Draw });
          }
        });
      }
    } catch (error) {
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  /**
   * This method is triggered when a client disconnects from the server.
   * It removes the player from the game and sends a 'Game Over' message to all players.
   *
   * @param client - The disconnected socket client.
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.gameService.removePlayer(client.id);
    this.server.emit('gameOver', { text: GameMessages.Disconected });
  }
}
