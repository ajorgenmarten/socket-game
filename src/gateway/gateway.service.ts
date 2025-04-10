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
import { Subject, takeUntil, timer } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { SetNumberInput } from 'src/game/domain/game.ports';
import { GameService } from 'src/game/game.service';

const SOCKET_EMIT_EVENTS = {
  ONLINE_STATUS: 'online-status',
  WAIT_TIMEOUT: 'wait-timeout',
  RIVAL_DISCONNECTED: 'rival-disconnected',
  GAME_READY: 'game-ready',
  NUMBER_SETTED: 'number-setted',
  JOINED_TO_GAME: 'joined-to-game',
  ERROR: 'error',
};

const SOCKET_LISTEN_EVENTS = {
  CREATE_GAME: 'create-game',
  JOIN_GAME: 'join-game',
  SET_NUMBER: 'set-number',
};

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

  private games: Map<string, { countdown$: Subject<void> }> = new Map();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    Logger.verbose(`Cliente conectado (id: ${client.id})`);
    this.emitPlayersConnected();
  }
  handleDisconnect(client: Socket) {
    Logger.verbose(`Cliente desconectado (id: ${client.id})`);
    const disconnectionResponse = this.gameService.disconnectedPlayer(
      client.id,
    );
    if (disconnectionResponse.socketIdRival) {
      this.getSocket(disconnectionResponse.socketIdRival)?.emit(
        SOCKET_EMIT_EVENTS.RIVAL_DISCONNECTED,
        disconnectionResponse.gameCode,
      );
    }
    if (disconnectionResponse.gameCode) {
      this.games.get(disconnectionResponse.gameCode)?.countdown$.next();
      this.games.get(disconnectionResponse.gameCode)?.countdown$.complete();
      this.games.delete(disconnectionResponse.gameCode);
    }
    this.emitPlayersConnected();
  }
  afterInit() {
    Logger.verbose('Gateway websocket esta funcionando');
  }
  private getSocket(clientId: string) {
    return this.server.sockets.sockets.get(clientId);
  }
  private emitError(
    clients: string | Socket | (string | Socket)[],
    message: string = 'Internal Server Error',
    from?: string,
    data?: unknown,
  ) {
    const emit = (client: string | Socket) => {
      let socket: Socket | undefined = undefined;
      if (typeof client == 'string') socket = this.getSocket(client);
      if (typeof client == 'object') socket = client;
      socket?.emit(SOCKET_EMIT_EVENTS.ERROR, { message, from, data });
    };
    if (Array.isArray(clients)) for (const client of clients) emit(client);
    else emit(clients);
  }
  private emitPlayersConnected() {
    this.server.emit(
      SOCKET_EMIT_EVENTS.ONLINE_STATUS,
      this.server.sockets.sockets.size,
    );
  }

  @SubscribeMessage(SOCKET_LISTEN_EVENTS.CREATE_GAME)
  createGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.create(code, client.id);
      const countdown$ = new Subject<void>();
      timer(60000)
        .pipe(takeUntil(countdown$))
        .subscribe(() => {
          this.gameService.timeout(game.gameCode);
          this.games.delete(game.gameCode);
          const socket = this.getSocket(client.id);
          socket?.emit(SOCKET_EMIT_EVENTS.WAIT_TIMEOUT, game.gameCode);
          Logger.verbose(
            'Juego cerrado porque se ha agotado el tiempo de espera',
          );
        });
      this.games.set(game.gameCode, { countdown$ });
      Logger.verbose('Juego creado...');
    } catch (error) {
      this.emitError(
        client,
        (error as Error).message,
        SOCKET_LISTEN_EVENTS.CREATE_GAME,
      );
    }
  }
  @SubscribeMessage(SOCKET_LISTEN_EVENTS.JOIN_GAME)
  joinToGame(@MessageBody() code: string, @ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.join(code, client.id);
      this.games.get(game.gameCode)?.countdown$.next();
      this.games.get(game.gameCode)?.countdown$.complete();
      this.games.delete(game.gameCode);

      const joinedSocket = this.getSocket(client.id);
      const ownerSocket = this.getSocket(game.socketIdOwner);
      joinedSocket?.emit(SOCKET_EMIT_EVENTS.JOINED_TO_GAME, game);
      ownerSocket?.emit(SOCKET_EMIT_EVENTS.JOINED_TO_GAME, game);
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(
        client,
        (error as Error).message,
        SOCKET_LISTEN_EVENTS.JOIN_GAME,
      );
    }
  }
  @SubscribeMessage(SOCKET_LISTEN_EVENTS.SET_NUMBER)
  setNumber(
    @MessageBody() data: SetNumberInput,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const setNumberResult = this.gameService.setSecretNumber(
        data.code,
        client.id,
        data.number,
      );
      if (!setNumberResult.rivalSocketId)
        return client.emit(SOCKET_EMIT_EVENTS.NUMBER_SETTED);
      const rivalSocket = this.getSocket(setNumberResult.rivalSocketId);
      rivalSocket?.emit(SOCKET_EMIT_EVENTS.GAME_READY);
      client.emit(SOCKET_EMIT_EVENTS.GAME_READY);
    } catch (error) {
      Logger.error((error as Error).message);
      this.emitError(
        client,
        (error as Error).message,
        SOCKET_LISTEN_EVENTS.SET_NUMBER,
      );
    }
  }
}
