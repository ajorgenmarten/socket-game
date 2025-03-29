import { Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { GatewayService } from './gateway.service';

@Module({
  imports: [GameModule],
  providers: [GatewayService],
})
export class GatewayModule {}
