import { Injectable } from '@nestjs/common';
import { CreateGame } from './application/CreateGame';
import { JoinToGame } from './application/JoinToGame';
import { DisconnectPlayer } from './application/DisconnectPlayer';
import { GamesStats } from './application/GamesStats';

@Injectable()
export class GameService {
  constructor(
    private readonly createGame: CreateGame,
    private readonly joinToGame: JoinToGame,
    private readonly disconnectPlayer: DisconnectPlayer,
    public readonly gameStats: GamesStats,
  ) {}
  create(code: string, socketId: string) {
    return this.createGame.execute(code, socketId);
  }
  join(code: string, socketId: string) {
    return this.joinToGame.execute(code, socketId);
  }
  disconnectedPlayer(socketId: string) {
    return this.disconnectPlayer.execute(socketId);
  }
}
