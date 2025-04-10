import { Injectable } from '@nestjs/common';
import { GameNotFound, PlayerIsInAnotherGame } from '../domain/game.exceptions';
import { GameRepository, JoinToGameResponse } from '../domain/game.ports';

@Injectable()
export class JoinToGame {
  constructor(private readonly gameRepository: GameRepository) {}

  /**
   * Agrega un jugador a una partida, si la partida no ha sido
   * creada se lanza una excepcion de que la partida no existe,
   * si la partida ya tiene los dos jugadores se lanza una
   * excepcion de que la partida está llena (esto ya se maneja
   * en la entidad de Game), si el jugador invitado
   * ya está en otra partida se lanza una excepcion de que el
   * jugador ya está en otra partida.
   * @param code codigo del juego al que el invitado se desea unir
   * @param socketId id del socket del jugador que se quiere unir al jugo
   * @returns retorn el codigo del juego, el id del socket del invitado, y el id del socket del creador
   */
  execute(code: string, socketId: string): JoinToGameResponse {
    const game = this.gameRepository.findByCode(code);
    if (!game) throw new GameNotFound(code);
    if (this.gameRepository.gameWithPlayer(socketId))
      throw new PlayerIsInAnotherGame(socketId);
    game.joinToMatch(socketId);
    this.gameRepository.updateGame(game);
    return {
      gameCode: game.Code,
      socketIdJoined: socketId,
      socketIdOwner: game.OwnerSocketId,
    };
  }
}
