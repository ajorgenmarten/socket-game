import { Injectable } from '@nestjs/common';
import { GameRepository } from '../domain/game.ports';

@Injectable()
export class GamesStats {
  constructor(private readonly gameRepository: GameRepository) {}
  getAll() {
    return this.gameRepository.Games;
  }
  getDetail(code: string) {
    return this.gameRepository.findByCode(code);
  }
}
