import { GameIsFull, NumberHasBeenStablished } from './game.exceptions';

export class Game {
  private joinedSocketId: string | null = null;
  private joinedNumber: string | null = null;
  private ownerNumber: string | null = null;
  private turnOf = 'owner';
  constructor(
    private code: string,
    private ownerSocketId: string,
  ) {}

  joinToMatch(socketId: string) {
    if (this.joinedSocketId != null) throw new GameIsFull();
    this.joinedSocketId = socketId;
  }

  private numberValidation(number: string) {
    if (number.length != 4) throw new Error(`El numero debe tener 4 digitos`);
    if (number.startsWith('0'))
      throw new Error(`El numero no puede comenzar con 0`);
    if (new Set(number).size != number.length)
      throw new Error(`El numero no puede repetir dígitos`);
    return /^[0-9]*$/.test(number);
  }

  setOwnerNumber(number: string) {
    if (this.ownerNumber != null) throw new NumberHasBeenStablished();
    this.numberValidation(number);
    this.ownerNumber = number;
  }
  setJoinedNumber(number: string) {
    if (this.joinedNumber != null) throw new NumberHasBeenStablished();
    this.numberValidation(number);
    this.joinedNumber = number;
  }
  private getAsserts(tryNumber: string, number: string) {
    if (tryNumber == number) return 4;
    let asserts = 0;
    for (let i = 0; i < 4; i++) if (tryNumber[i] == number[i]) asserts++;
    return asserts;
  }
  joinedTry(number: string) {
    if (this.joinedNumber == null) throw new Error(`La partida no ha iniciado`);
    return this.getAsserts(number, this.joinedNumber);
  }
  ownerTry(number: string) {
    if (this.ownerNumber == null) throw new Error(`La partida no ha iniciado`);
    return this.getAsserts(number, this.ownerNumber);
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

  get OwnerNumber() {
    return this.ownerNumber;
  }

  get JoinedNumber() {
    return this.joinedNumber;
  }
}
