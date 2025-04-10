import { Injectable } from '@nestjs/common';
import { Game } from '../domain/game.entity';
import { GameRepository } from '../domain/game.ports';

@Injectable()
export class InMemoryGameRepository implements GameRepository {
  private games: Game[] = [];
  insertGame(game: Game): Game {
    this.games.push(game);
    return game;
  }
  findByCode(code: string): Game | undefined {
    return this.games.find((game) => game.Code == code);
  }
  updateGame(game: Game): boolean {
    const findIndex = this.games.findIndex(
      (storeGame) => storeGame.Code == game.Code,
    );
    if (findIndex == -1) return false;
    this.games[findIndex] = game;
    return true;
  }
  gameWithPlayer(socketId: string): Game | undefined {
    const gamefound = this.games.find((game) => {
      return game.JoinedSocketId == socketId || game.OwnerSocketId == socketId;
    });
    return gamefound;
  }
  delete(code: string): boolean {
    const findIndex = this.games.findIndex((game) => game.Code == code);
    if (findIndex != -1) this.games.splice(findIndex, 1);
    return true;
  }
  get Games(): Game[] {
    return this.games;
  }
}
