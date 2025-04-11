import { Injectable } from '@nestjs/common';
import { GameNotFound } from '../domain/game.exceptions';
import { GameRepository, TestNumberResponse } from '../domain/game.ports';

@Injectable()
export class TestNumber {
  constructor(private readonly gameRepository: GameRepository) {}
  /**
   * Comprueba si el número enviado es el número secreto del rival.
   * @param code código de la partida
   * @param socketId código del jugador que va a probar suerte con
   * el número
   * @param number número del jugador con el que va a probar si es
   * el número secreto del rival
   */
  execute(code: string, socketId: string, number: string): TestNumberResponse {
    const game = this.gameRepository.gameWithPlayer(socketId);
    if (!game) throw new GameNotFound(code);
    if (game.Code != code) throw new GameNotFound(code);
    const testNumber = game.testNumber(socketId, number);
    this.gameRepository.updateGame(game);
    return {
      gameCode: game.Code,
      requestedSocketId: socketId,
      rivalSocketId: testNumber.rivalSocketId,
      asserts: testNumber.asserts,
    };
  }
}
