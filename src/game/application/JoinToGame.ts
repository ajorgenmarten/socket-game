import { Injectable } from '@nestjs/common';
import { GameNotFound, PlayerIsInAnotherGame } from '../domain/game.exceptions';
import { GameRepository } from '../domain/game.ports';

@Injectable()
export class JoinToGame {
  constructor(private readonly gameRepository: GameRepository) {}

  execute(code: string, socketId: string) {
    const game = this.gameRepository.findByCode(code);
    if (!game) throw new GameNotFound(code);
    if (this.gameRepository.hasPlayer(socketId))
      throw new PlayerIsInAnotherGame(socketId);
    game.joinToMatch(socketId);
    this.gameRepository.updateGame(game);
    return game;
  }
}
