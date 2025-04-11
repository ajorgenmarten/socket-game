import { Injectable } from '@nestjs/common';
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
import { ErrorService } from 'src/shared/error.service';
import { Subject, takeUntil, timer } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { SetNumberInput, TestNumberInput } from 'src/game/domain/game.ports';
import { GameService } from 'src/game/game.service';

const SOCKET_EMIT_EVENTS = {
  GAME_CREATED: 'game-created',
  ONLINE_STATUS: 'online-status',
  WAIT_TIMEOUT: 'wait-timeout',
  RIVAL_DISCONNECTED: 'rival-disconnected',
  GAME_READY: 'game-ready',
  NUMBER_SETTED: 'number-setted',
  JOINED_TO_GAME: 'joined-to-game',
  GAME_OVER: 'game-over',
  WINNER: 'winner',
  HAS_PLAYED: 'has-played',
  ERROR: 'error',
};

const SOCKET_LISTEN_EVENTS = {
  CREATE_GAME: 'create-game',
  JOIN_GAME: 'join-game',
  SET_NUMBER: 'set-number',
  TEST_NUMBER: 'test-number',
};

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class GatewayService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server: Server;

  private games: Map<string, { countdown$: Subject<void> }> = new Map();

  constructor(
    private readonly gameService: GameService,
    private readonly errorService: ErrorService,
  ) {}

  handleConnection(client: Socket) {
    this.errorService.logVerbose(`Cliente conectado (id: ${client.id})`);
    this.emitPlayersConnected();
  }
  handleDisconnect(client: Socket) {
    this.errorService.logVerbose(`Cliente desconectado (id: ${client.id})`);
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
    this.errorService.logVerbose('Gateway websocket esta funcionando');
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
      const game = this.gameService.create(code.toString(), client.id);
      const countdown$ = new Subject<void>();
      timer(60000)
        .pipe(takeUntil(countdown$))
        .subscribe(() => {
          this.gameService.timeout(game.gameCode);
          this.games.delete(game.gameCode);
          const socket = this.getSocket(client.id);
          socket?.emit(SOCKET_EMIT_EVENTS.WAIT_TIMEOUT, game.gameCode);
          this.errorService.logVerbose(
            'Juego cerrado porque se ha agotado el tiempo de espera',
          );
        });
      this.games.set(game.gameCode, { countdown$ });
      client.emit(SOCKET_EMIT_EVENTS.GAME_CREATED, code);
      this.errorService.logVerbose('Juego creado...');
    } catch (error) {
      const errorDetails = this.errorService.handleError({
        message:
          error instanceof Error ? error.message : 'Error al crear el juego',
        source: SOCKET_LISTEN_EVENTS.CREATE_GAME,
      });
      this.emitError(client, errorDetails.message, errorDetails.source);
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
      const errorDetails = this.errorService.handleError({
        message:
          error instanceof Error ? error.message : 'Error al unirse al juego',
        source: SOCKET_LISTEN_EVENTS.JOIN_GAME,
      });
      this.emitError(client, errorDetails.message, errorDetails.source);
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
      const errorDetails = this.errorService.handleError({
        message:
          error instanceof Error
            ? error.message
            : 'Error al establecer el número',
        source: SOCKET_LISTEN_EVENTS.SET_NUMBER,
      });
      this.emitError(client, errorDetails.message, errorDetails.source);
    }
  }
  @SubscribeMessage(SOCKET_LISTEN_EVENTS.TEST_NUMBER)
  testNumber(
    @MessageBody() data: TestNumberInput,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const testNumberResult = this.gameService.testSecretNumber(
        data.code,
        client.id,
        data.number,
      );
      if (testNumberResult.asserts == 4) {
        client.emit(SOCKET_EMIT_EVENTS.WINNER);
        this.getSocket(testNumberResult.rivalSocketId)?.emit(
          SOCKET_EMIT_EVENTS.GAME_OVER,
        );
        this.gameService.waitTimeout.execute(data.code);
      } else {
        client.emit(SOCKET_EMIT_EVENTS.HAS_PLAYED, {
          asserts: testNumberResult.asserts,
          youTurn: false,
          number: data.number,
        });
        this.getSocket(testNumberResult.rivalSocketId)?.emit(
          SOCKET_EMIT_EVENTS.HAS_PLAYED,
          {
            asserts: testNumberResult.asserts,
            youTurn: true,
            number: data.number,
          },
        );
      }
    } catch (error) {
      const errorDetails = this.errorService.handleError({
        message:
          error instanceof Error
            ? error.message
            : 'Error al establecer el número',
        source: SOCKET_LISTEN_EVENTS.TEST_NUMBER,
      });
      this.emitError(client, errorDetails.message, errorDetails.source);
    }
  }
}
