export class GameIsFull extends Error {
  constructor() {
    super(`El juego ya está completo`);
    this.name = GameIsFull.name;
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
