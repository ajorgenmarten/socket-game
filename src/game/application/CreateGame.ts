import { Injectable } from '@nestjs/common';
import { GameRepository } from '../domain/game.ports';
import {
  GameAlreadyExist,
  PlayerIsInAnotherGame,
} from '../domain/game.exceptions';

@Injectable()
export class CreateGame {
  constructor(private readonly gameRepository: GameRepository) {}

  execute(code: string, socketId: string) {
    if (this.gameRepository.findByCode(code)) throw new GameAlreadyExist(code);
    if (this.gameRepository.hasPlayer(socketId))
      throw new PlayerIsInAnotherGame(socketId);
    const game = this.gameRepository.createGame(code, socketId);
    return game;
  }
}
