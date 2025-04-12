import { Injectable } from '@nestjs/common';
import { FinishGameResponse, GameRepository } from '../domain/game.ports';
import { GameNotFound } from '../domain/game.exceptions';

@Injectable()
export class FinishGame {
  constructor(private readonly gameRepository: GameRepository) {}

  /**
   * Realiza el cierre de la partida (elimina la partida
   * del repositorio) si y solo si existe la partida con
   * el codigo recibido, y si el jugador se encuentra en dicha
   * partida. Esto devuelve el id del socket del jugador rival
   * del que cerró la partida en caso de que este establecido, y
   * y el id del socket del jugador que cerró la partida.
   * @param code codigo de la partida que se va a finalizar
   * @param socketId id del socket del jugador que quiere
   * salir de la partida o finalizar la misma
   */
  execute(code: string, socketId: string): FinishGameResponse {
    const game = this.gameRepository.gameWithPlayer(socketId);
    if (!game) throw new GameNotFound(code);
    if (game.Code !== code) throw new GameNotFound(code);
    this.gameRepository.delete(game.Code);
    const rivalSocketId =
      game.OwnerSocketId == socketId ? game.JoinedSocketId : game.OwnerSocketId;
    return {
      rivalSocketId,
      requestSocketId: socketId,
    };
  }
}
