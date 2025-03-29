import { Game } from './game.entity';

export abstract class GameRepository {
  abstract createGame(code: string, socketId: string): Game;
  abstract findByCode(code: string): Game | undefined;
  abstract updateGame(game: Game): boolean;
  abstract hasPlayer(socketId: string): Game | undefined;
  abstract delete(code: string): boolean;
  abstract get Games(): Game[];
}
