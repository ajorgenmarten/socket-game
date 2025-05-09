import { Injectable } from '@nestjs/common';
import { CreateGame } from './application/CreateGame';
import { JoinToGame } from './application/JoinToGame';
import { DisconnectPlayer } from './application/DisconnectPlayer';
import { GamesStats } from './application/GamesStats';
import { WaitTimeout } from './application/WaitTimeout';
import { SetNumber } from './application/SetNumber';
import { TestNumber } from './application/TestNumber';
import { FinishGame } from './application/FinishGame';

@Injectable()
export class GameService {
  constructor(
    private readonly createGame: CreateGame,
    private readonly joinToGame: JoinToGame,
    private readonly disconnectPlayer: DisconnectPlayer,
    public readonly gameStats: GamesStats,
    public readonly waitTimeout: WaitTimeout,
    public readonly setNumber: SetNumber,
    public readonly testNumber: TestNumber,
    public readonly finishGame: FinishGame,
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
  timeout(code: string) {
    return this.waitTimeout.execute(code);
  }
  setSecretNumber(code: string, socketId: string, number: string) {
    return this.setNumber.execute(code, socketId, number);
  }
  testSecretNumber(code: string, socketId: string, number: string) {
    return this.testNumber.execute(code, socketId, number);
  }
  endMatch(code: string, socketId: string) {
    return this.finishGame.execute(code, socketId);
  }
}
