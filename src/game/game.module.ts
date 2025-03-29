import { Module } from '@nestjs/common';
import { CreateGame } from './application/CreateGame';
import { JoinToGame } from './application/JoinToGame';
import { GameRepository } from './domain/game.ports';
import { InMemoryGameRepository } from './infrastructure/InMemoryGameRepository';
import { GameService } from './game.service';
import { DisconnectPlayer } from './application/DisconnectPlayer';
import { GamesStats } from './application/GamesStats';

@Module({
  providers: [
    CreateGame,
    JoinToGame,
    GameService,
    DisconnectPlayer,
    GamesStats,
    { provide: GameRepository, useClass: InMemoryGameRepository },
  ],
  exports: [GameService],
})
export class GameModule {}
