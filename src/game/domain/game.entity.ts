import {
  GameIsFull,
  GameIsNotReady,
  IsNotYourTurn,
  NumberHasBeenStablished,
} from './game.exceptions';
import { TestNumberReturn } from './game.ports';

export class Game {
  private joinedSocketId: string | null = null;
  private joinedNumber: string | null = null;
  private ownerNumber: string | null = null;
  private turnFor: string;

  constructor(
    private readonly code: string,
    private ownerSocketId: string,
  ) {
    this.turnFor = ownerSocketId;
  }

  joinToMatch(socketId: string) {
    if (this.joinedSocketId != null) throw new GameIsFull();
    this.joinedSocketId = socketId;
  }

  private ensureNumber(number: string) {
    if (number.length != 4) throw new Error(`El numero debe tener 4 digitos`);
    if (number.startsWith('0'))
      throw new Error(`El numero no puede comenzar con 0`);
    if (new Set(number).size != number.length)
      throw new Error(`El numero no puede repetir dígitos`);
    if (!/^[0-9]*$/.test(number))
      throw new Error(`El número solo puede contener dígitos`);
  }

  setOwnerNumber(number: string) {
    if (this.ownerNumber != null) throw new NumberHasBeenStablished();
    this.ensureNumber(number);
    this.ownerNumber = number;
  }
  setJoinedNumber(number: string) {
    if (this.joinedNumber != null) throw new NumberHasBeenStablished();
    this.ensureNumber(number);
    this.joinedNumber = number;
  }
  private getAsserts(tryNumber: string, number: string) {
    if (tryNumber == number) return 4;
    let asserts = 0;
    for (let i = 0; i < 4; i++) if (tryNumber[i] == number[i]) asserts++;
    return asserts;
  }
  testNumber(playerSocketId: string, number: string): TestNumberReturn {
    this.ensureNumber(number);
    if (this.turnFor !== playerSocketId) throw new IsNotYourTurn();
    if (!this.joinedSocketId || !this.joinedNumber || !this.ownerNumber)
      throw new GameIsNotReady();
    const isOwner = this.ownerSocketId == playerSocketId;
    const [asserts, rivalSocketId] = isOwner
      ? [this.joinedTry(number), this.joinedSocketId]
      : [this.ownerTry(number), this.ownerSocketId];
    this.turnFor = isOwner ? this.joinedSocketId : this.ownerSocketId;
    return {
      asserts,
      rivalSocketId,
      clientSocketId: playerSocketId,
    };
  }
  private joinedTry(number: string) {
    return this.getAsserts(number, this.joinedNumber as string);
  }
  private ownerTry(number: string) {
    return this.getAsserts(number, this.ownerNumber as string);
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

  get TurnFor() {
    return this.turnFor;
  }
}
