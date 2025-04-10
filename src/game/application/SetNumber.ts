import { Injectable } from '@nestjs/common';
import { GameIsNotReady, GameNotFound } from '../domain/game.exceptions';
import { GameRepository, SetNumberResponse } from '../domain/game.ports';

@Injectable()
export class SetNumber {
  constructor(private readonly gameRepository: GameRepository) {}
  /**
   * Establece el número secreto del cliente que solicitó
   * para empezar el juego, a menos que no exista la partida
   * o no se ecuentre en dicha partida o haya establecido
   * su número secreto.
   * @param code Codigo de la partida
   * @param socketId Id del socket del cliente que
   * quiere establecer su número para empezar el juego
   * @param number Número que quiere establecer
   * @returns Retorna el código de la partida, el id del
   * socket del cliente que solicitó establecer su número
   * secreto y el id del socket del rival en caso de que
   * los dos ya hayan establecido su número secreto.
   */
  execute(code: string, socketId: string, number: string): SetNumberResponse {
    // Buscar juego donde se encuentre el cliente y si no
    // hay algun juego o el codigo del juego no es igual
    // al que envio el cliente se lanza un error de juego
    // no encontrado. (Ya en esta parte se valida que el
    // cliente esta en la partida correcta)
    const game = this.gameRepository.gameWithPlayer(socketId);
    if (!game?.JoinedSocketId) throw new GameIsNotReady();
    if (!game) throw new GameNotFound(code);
    if (game.Code == code) throw new GameNotFound(code);

    if (game.JoinedSocketId == socketId) {
      game.setJoinedNumber(number);
    } else {
      game.setOwnerNumber(number);
    }

    // Aqui se recoge el id de los socket, si ya los dos
    // jugadores han establecido su número secreto se resuleve
    // el id del socket rival, sino el socket del rival es null
    const requestedSocketId = socketId;
    const rivalSocketId =
      !game.OwnerNumber || !game.JoinedNumber
        ? null
        : game.OwnerSocketId == socketId
          ? game.JoinedSocketId
          : game.OwnerSocketId;
    return {
      gameCode: game.Code,
      requestedSocketId,
      rivalSocketId,
    };
  }
}
