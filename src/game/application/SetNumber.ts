import { GameNotFound } from '../domain/game.exceptions';
import { GameRepository } from '../domain/game.ports';

export class SetNumber {
  constructor(private readonly gameRepository: GameRepository) {}
  execute(code: string, socketId: string, number: string) {
    const game = this.gameRepository.findByCode(code);
    if (!game) throw new GameNotFound(code);
    if (game.JoinedSocketId == socketId) {
      game.setJoinedNumber(number);
    } else {
      game.setOwnerNumber(number);
    }
    return game;
  }
}
