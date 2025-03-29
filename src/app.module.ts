import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AdminModule, GatewayModule],
})
export class AppModule {}
