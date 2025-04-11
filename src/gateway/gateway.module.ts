import { Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { SharedModule } from 'src/shared/shared.module';
import { GatewayService } from './gateway.service';

@Module({
  imports: [GameModule, SharedModule],
  providers: [GatewayService],
})
export class GatewayModule {}
