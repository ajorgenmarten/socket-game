import { GameIsFull } from './game.exceptions';

export class Game {
  private joinedSocketId: string | null = null;
  constructor(
    private code: string,
    private ownerSocketId: string,
  ) {}

  joinToMatch(socketId: string) {
    if (this.joinedSocketId != null) throw new GameIsFull();
    this.joinedSocketId = socketId;
  }

  get Code() {
    return this.code;
  }

  get OwnerSocketId() {
    return this.ownerSocketId;
  }

  get JoinedSocketId() {
    return this.joinedSocketId;
  }
}
