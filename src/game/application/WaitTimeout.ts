import { Injectable } from '@nestjs/common';
import { GameRepository } from '../domain/game.ports';

@Injectable()
export class WaitTimeout {
  constructor(private readonly gameRepository: GameRepository) {}
  /**
   * Simplemente elimina la partida de la base de datos (Memoria)
   * @param code Codigo de la partida
   */
  execute(code: string) {
    this.gameRepository.delete(code);
  }
}
