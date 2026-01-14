// path: src/events/events.subscriber.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventsGateway } from './events.gateway';
import { AiNotificationMessage } from './dtos/ai-result.dto';

@Injectable()
export class EventsSubscriberService implements OnModuleInit, OnModuleDestroy {
  private redisSub: Redis;
  private readonly logger = new Logger(EventsSubscriberService.name);
  private readonly CHANNEL_NAME = 'channel:ai_results';

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    // 修复：使用 getOrThrow 确保返回类型仅为 string，排除 undefined
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    
    // 初始化
    this.redisSub = new Redis(redisUrl);

    this.redisSub.subscribe(this.CHANNEL_NAME, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${this.CHANNEL_NAME}`, err);
      } else {
        this.logger.log(`Subscribed to Redis channel: ${this.CHANNEL_NAME}`);
      }
    });

    this.redisSub.on('message', (channel, message) => {
      if (channel === this.CHANNEL_NAME) {
        this.handleMessage(message);
      }
    });
  }

  onModuleDestroy() {
    this.redisSub.disconnect();
  }

  private handleMessage(rawMessage: string) {
    try {
      // 1. Parse JSON
      const parsed: AiNotificationMessage = JSON.parse(rawMessage);

      // 2. 基础验证
      if (!parsed.userId || !parsed.event) {
        this.logger.warn(`Invalid message format received: ${rawMessage}`);
        return;
      }

      // 3. 通过 Gateway 分发
      this.eventsGateway.emitToUser(parsed.userId, parsed.event, parsed.data);
      
    } catch (error) {
      this.logger.error('Error processing Redis message', error.stack);
    }
  }
}