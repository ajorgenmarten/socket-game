import { Game } from './game.entity';

export abstract class GameRepository {
  abstract insertGame(game: Game): Game;
  abstract findByCode(code: string): Game | undefined;
  abstract updateGame(game: Game): boolean;
  abstract gameWithPlayer(socketId: string): Game | undefined;
  abstract delete(code: string): boolean;
  abstract get Games(): Game[];
}

export interface TestNumberReturn {
  clientSocketId: string;
  rivalSocketId: string;
  asserts: number;
}

export interface SetNumberInput {
  code: string;
  number: string;
}

export interface CraeteGameResponse {
  socketIdOwner: string;
  gameCode: string;
}

export interface JoinToGameResponse {
  gameCode: string;
  socketIdOwner: string;
  socketIdJoined: string;
}

export interface DisconnectPlayerResponse {
  socketIdRival: string | null;
  gameCode: string | null;
}

export interface SetNumberResponse {
  gameCode: string;
  requestedSocketId: string;
  rivalSocketId: string | null;
}

export interface TestNumberResponse {
  gameCode: string;
  rivalSocketId: string;
  requestedSocketId: string;
  asserts: number;
}

export interface TestNumberInput {
  code: string;
  number: string;
}
