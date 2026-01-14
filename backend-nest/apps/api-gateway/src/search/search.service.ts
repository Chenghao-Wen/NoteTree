// path: src/search/search.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { SearchRequestDto, SearchResponseDto } from './dtos/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly STREAM_KEY = 'stream:search';
  
  // 假设我们在全局模块或 RedisModule 中提供了一个标准的 Redis 实例
  // 如果没有，可以使用 @Inject('REDIS_CLIENT') 或自行实例化
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis, 
  ) {}

  async queueSearchJob(userId: string, dto: SearchRequestDto): Promise<SearchResponseDto> {
    const jobId = uuidv4();
    const timestamp = Date.now().toString();

    // 构建 Stream 消息 payload
    // 必须包含 userId，以便 Python 处理完后，Task-03 的 WebSocket 网关知道发给谁
    const payload = [
      'jobId', jobId,
      'userId', userId,
      'query', dto.query,
      'timestamp', timestamp
    ];

    try {
      // XADD stream:search * key value key value ...
      await this.redis.xadd(this.STREAM_KEY, '*', ...payload);
      
      this.logger.log(`Search Job queued: ${jobId} for User: ${userId}`);

      return {
        jobId,
        status: 'ACCEPTED',
      };
    } catch (error) {
      this.logger.error(`Failed to push to Redis Stream: ${error.message}`);
      throw error; // 全局异常过滤器会捕获并返回 500
    }
  }
}