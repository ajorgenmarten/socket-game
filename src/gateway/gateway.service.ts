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
import { GameService } from 'src/game/game.service';

type ConditionalReturn<T> =
  T extends Array<string> ? Socket[] : Socket | undefined;

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
  private getSockets<T>(clients: T): ConditionalReturn<T> {
    if (Array.isArray(clients)) {
      const sockets: Socket[] = [];
      for (const client of clients as T & string[]) {
        const socket = this.server.sockets.sockets.get(client);
        if (socket) sockets.push(socket);
      }
      return sockets as ConditionalReturn<T>;
    } else if (typeof clients == 'string')
      return this.server.sockets.sockets.get(clients) as ConditionalReturn<T>;
    else
      throw new Error(
        "El parametro 'clients' debe ser un string o un arreglo de string",
      );
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
        socket = this.getSockets(client);
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
      clients.forEach((client) => client.emit('game-started', game));
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(client, (error as Error).message, 'join-game');
    }
  }
}
