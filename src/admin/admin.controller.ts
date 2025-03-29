import { Controller, Get, Param } from '@nestjs/common';
import { GameService } from 'src/game/game.service';

@Controller('/admin')
export class AdminController {
  constructor(private readonly gameService: GameService) {}

  @Get('/all-games')
  allGames() {
    return this.gameService.gameStats.getAll();
  }

  @Get('/game/:code')
  gameDetail(@Param('code') code: string) {
    return this.gameService.gameStats.getDetail(code);
  }
}
