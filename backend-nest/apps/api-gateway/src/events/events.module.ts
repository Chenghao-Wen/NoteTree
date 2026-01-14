// path: src/events/events.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt'; // 假设 Task-01 已配置好全局 Config 或 export 了 AuthModule
import { EventsGateway } from './events.gateway';
import { EventsSubscriberService } from './events.subscriber.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule, // 用于 WS 握手鉴权
  ],
  providers: [EventsGateway, EventsSubscriberService],
  exports: [EventsGateway],
})
export class EventsModule {}