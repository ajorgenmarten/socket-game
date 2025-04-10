import { Module } from '@nestjs/common';
import { CreateGame } from './application/CreateGame';
import { JoinToGame } from './application/JoinToGame';
import { GameRepository } from './domain/game.ports';
import { InMemoryGameRepository } from './infrastructure/InMemoryGameRepository';
import { GameService } from './game.service';
import { DisconnectPlayer } from './application/DisconnectPlayer';
import { GamesStats } from './application/GamesStats';
import { WaitTimeout } from './application/WaitTimeout';
import { SetNumber } from './application/SetNumber';

@Module({
  providers: [
    CreateGame,
    JoinToGame,
    DisconnectPlayer,
    GamesStats,
    WaitTimeout,
    SetNumber,
    GameService,
    { provide: GameRepository, useClass: InMemoryGameRepository },
  ],
  exports: [GameService],
})
export class GameModule {}
