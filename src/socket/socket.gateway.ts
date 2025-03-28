/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Game } from './game.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server: Server;
  private games: Game[] = [];

  handleConnection() {
    Logger.log('Client Connected', 'SocketInstance');
    this.server.emit('online-status', this.server.sockets.sockets.size);
  }
  handleDisconnect(client: Socket) {
    Logger.error('Client Disconnected', 'SocketInstance');
    this.emitRivalDisconnected(client);
    this.server.emit('online-status', this.server.sockets.sockets.size);
  }
  afterInit() {
    Logger.log('Socket Gateway Initialized', 'SocketInstance');
  }

  private isPlaying(socketId: string) {
    return Boolean(
      this.games.find(
        (game) => game.SocketId == socketId || game.JoinedSocketId == socketId,
      ),
    );
  }

  private emitRivalDisconnected(client: Socket) {
    let gameIndex = -1;
    const game = this.games.find((game, index) => {
      if (game.SocketId == client.id || game.JoinedSocketId == client.id) {
        gameIndex = index;
        return true;
      }
      return false;
    });
    if (!game) return;
    this.games.splice(gameIndex, 1);
    const rivalSocketId =
      game.SocketId == client.id ? game.JoinedSocketId : game.SocketId;
    if (!rivalSocketId) return;
    this.server.sockets.sockets.get(rivalSocketId)?.emit('rival-disconnected');
  }

  private sendError(
    clients: string | Socket | (string | Socket)[],
    message: string,
    In: string,
    data?: any,
  ) {
    const emit = (client: Socket | string) => {
      let socket: Socket | undefined = undefined;
      if (typeof client == 'string') {
        socket = this.server.sockets.sockets.get(client);
      }
      if (typeof client == 'object') {
        socket = client;
      }
      socket?.emit('error', { message, in: In, data });
    };
    if (Array.isArray(clients)) {
      for (const client of clients) {
        emit(client);
      }
      return;
    }
    emit(clients);
  }

  @SubscribeMessage('create-game')
  createGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    if (this.isPlaying(client.id)) return;
    if (this.games.find((game) => game.Code == code)) return;
    const game = new Game(code, client.id);
    this.games.push(game);
    client.emit('game-created', game.Code);
  }

  @SubscribeMessage('game-waiting-timeout')
  gameTimeOut(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    const findIndex = this.games.findIndex((game) => game.Code == code);
    if (findIndex !== -1) {
      this.games.splice(findIndex, 1);
    }
    client.emit('game-waiting-timeout');
  }

  @SubscribeMessage('join-game')
  joinToGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    const game = this.games.find((game) => game.Code == code);
    if (!game)
      return this.sendError(client.id, 'Ya este juego no existe', 'join-game');
    try {
      game.joinPlayer(client.id);
      client.emit('join-game', game.Code);
    } catch {
      this.sendError(
        client,
        'Ya el juego tiene sus dos participantes',
        'join-game',
      );
    }
  }
}
