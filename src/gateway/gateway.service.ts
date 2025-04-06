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
import { SetNumberInput } from 'src/game/domain/game.ports';
import { GameService } from 'src/game/game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GatewayService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server: Server;
  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    Logger.verbose(`Cliente conectado (id: ${client.id})`);
    this.emitOnlineStatus();
  }
  handleDisconnect(client: Socket) {
    Logger.verbose(`Cliente desconectado (id: ${client.id})`);
    //cerrar partida si se encuentra en una
    const game = this.gameService.disconnectedPlayer(client.id);
    //avisar a el rival de que se ha desconectado
    if (game) {
      const rival =
        game.JoinedSocketId == client.id
          ? game.OwnerSocketId
          : game.JoinedSocketId;

      if (rival)
        this.server.sockets.sockets.get(rival)?.emit('rival-disconnected');
    }
    this.emitOnlineStatus();
  }
  afterInit() {
    Logger.verbose('Gateway websocket esta funcionando');
  }
  private getSocket(clientId: string) {
    return this.server.sockets.sockets.get(clientId);
  }
  private getSockets(clients: string[]) {
    const sockets: Socket[] = [];
    for (const client of clients) {
      const socket = this.getSocket(client);
      if (socket) sockets.push(socket);
    }
    return sockets;
  }
  private emitError(
    clients: string | Socket | (string | Socket)[],
    message: string = 'Internal Server Error',
    from?: string,
    data?: unknown,
  ) {
    const emit = (client: string | Socket) => {
      let socket: Socket | undefined = undefined;
      if (typeof client == 'string') {
        socket = this.getSocket(client);
      }
      if (typeof client == 'object') {
        socket = client;
      }
      socket?.emit('error', { message, from, data });
    };
    if (Array.isArray(clients)) for (const client of clients) emit(client);
    else emit(clients);
  }
  private emitOnlineStatus() {
    this.server.emit('online-status', this.server.sockets.sockets.size);
  }
  @SubscribeMessage('end-game')
  endGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    try {
      console.log('end-game');
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(client, (error as Error).message, 'end-game');
    }
  }

  @SubscribeMessage('create-game')
  createGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.create(code, client.id);
      client.emit('game-created', game);
      Logger.verbose('Juego creado...');
    } catch (error) {
      this.emitError(client, (error as Error).message, 'create-game');
    }
  }
  @SubscribeMessage('join-game')
  joinToGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.join(code, client.id);
      const clients = this.getSockets([
        game.JoinedSocketId as string,
        game.OwnerSocketId,
      ]);
      clients.forEach((client) => client.emit('joined-to-game', game));
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(client, (error as Error).message, 'join-game');
    }
  }
  @SubscribeMessage('set-number')
  setNumber(
    @MessageBody() { number, code }: SetNumberInput,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = this.gameService.setSecretNumber(number, code, client.id);
      const clientSocketId =
        game.OwnerSocketId == client.id
          ? game.OwnerSocketId
          : game.JoinedSocketId;
      const rivalSocketRival =
        game.OwnerSocketId == client.id
          ? game.JoinedSocketId
          : game.OwnerSocketId;
      const clientSocket = this.getSocket(clientSocketId as string);
      const rivalSocket = this.getSocket(rivalSocketRival as string);

      if (game.OwnerNumber != null && game.JoinedNumber != null) {
        const turn = Math.random() * 100 > 50 ? [true, false] : [false, true];
        clientSocket?.emit('game-started', turn[0]);
        rivalSocket?.emit('game-started', turn[1]);
      } else {
        clientSocket?.emit('number-setted');
        rivalSocket?.emit('rival-is-ready');
      }
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(client, (error as Error).message, 'set-number');
    }
  }
}
