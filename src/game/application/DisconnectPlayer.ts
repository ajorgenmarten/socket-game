import { Injectable } from '@nestjs/common';
import { DisconnectPlayerResponse, GameRepository } from '../domain/game.ports';

@Injectable()
export class DisconnectPlayer {
  constructor(private readonly gameRepository: GameRepository) {}

  /**
   * Elimina la partida en la que se encuentra el jugador y retorna
   * el id del socket del otro jugador de la partida si se encuentra
   * la partida y si hay otro jugador.
   * @param socketId Id del socket del jugador que se ha desconectado
   * @returns retorna el id del otro jugador de la partida si existe la
   * partida y hay otro jugador
   */
  execute(socketId: string): DisconnectPlayerResponse {
    const game = this.gameRepository.gameWithPlayer(socketId);
    if (game) this.gameRepository.delete(game.Code);
    const socketIdRival = !game
      ? null
      : game.JoinedSocketId == socketId
        ? game.OwnerSocketId
        : game.JoinedSocketId;
    const gameCode = !game ? null : game.Code;
    return {
      socketIdRival,
      gameCode,
    };
  }
}
