import { Injectable } from '@nestjs/common';
import { CraeteGameResponse, GameRepository } from '../domain/game.ports';
import {
  GameAlreadyExist,
  PlayerIsInAnotherGame,
} from '../domain/game.exceptions';
import { Game } from '../domain/game.entity';

@Injectable()
export class CreateGame {
  constructor(private readonly gameRepository: GameRepository) {}

  /**
   * Crea una partida, pero si ya existe una partida con
   * este codigo, lanza una excepcion, y el id del socket
   * del jugador que crea la partida no puede estar en otra partida
   * @param code codigo de la partida
   * @param socketId id del socket del creador de la partida
   * @returns retorna el codigo de la partida
   */
  execute(code: string, socketId: string): CraeteGameResponse {
    if (this.gameRepository.findByCode(code)) throw new GameAlreadyExist(code);
    if (this.gameRepository.gameWithPlayer(socketId))
      throw new PlayerIsInAnotherGame(socketId);
    const game = new Game(code, socketId);
    this.gameRepository.insertGame(game);
    return {
      gameCode: code,
      socketIdOwner: socketId,
    };
  }
}
