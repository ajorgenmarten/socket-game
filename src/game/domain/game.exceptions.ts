export class GameIsFull extends Error {
  constructor() {
    super(`El juego ya está completo`);
    this.name = GameIsFull.name;
  }
}

export class GameIsNotReady extends Error {
  constructor() {
    super(`El juego no esta listo`);
    this.name = GameIsNotReady.name;
  }
}

export class IsNotYourTurn extends Error {
  constructor() {
    super(`No es tu turno`);
  }
}

export class NumberHasBeenStablished extends Error {
  constructor() {
    super(`El numero ya ha sido establecido`);
    this.name = NumberHasBeenStablished.name;
  }
}

export class GameAlreadyExist extends Error {
  constructor(code: string) {
    super(`Ya hay una partida con el codigo ${code}`);
    this.name = GameAlreadyExist.name;
  }
}

export class GameNotFound extends Error {
  constructor(code: string) {
    super(`No hay ninguna partida creada con este codigo ${code}`);
    this.name = GameNotFound.name;
  }
}

export class PlayerIsInAnotherGame extends Error {
  constructor(socketId: string) {
    super(`El Jugador ${socketId} ya está en otra partida.`);
    this.name = PlayerIsInAnotherGame.name;
  }
}
