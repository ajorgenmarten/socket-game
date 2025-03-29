import { Injectable } from '@nestjs/common';
import { GameRepository } from '../domain/game.ports';

@Injectable()
export class DisconnectPlayer {
  constructor(private readonly gameRepository: GameRepository) {}
  execute(socketId: string) {
    const game = this.gameRepository.hasPlayer(socketId);
    if (game) this.gameRepository.delete(game.Code);
    return game;
  }
}
