import { randomUUID } from 'crypto';

export class Game {
  private id: string;
  private joinedSockeIdt: string | null = null;
  constructor(
    private code: string,
    private socketId: string,
  ) {
    this.id = randomUUID();
  }

  joinPlayer(socketId: string) {
    if (this.joinedSockeIdt)
      throw new Error('Ya el juego tiene sus dos participantes');
    this.joinedSockeIdt = socketId;
  }

  get Id() {
    return this.id;
  }

  get JoinedSocketId() {
    return this.joinedSockeIdt;
  }

  get SocketId() {
    return this.socketId;
  }

  get Code() {
    return this.code;
  }
}
