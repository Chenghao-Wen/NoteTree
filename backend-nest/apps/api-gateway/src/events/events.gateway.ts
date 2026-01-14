// path: src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境需从 ConfigService 获取允许的 origin
  },
  namespace: 'events', // 命名空间，前端连接 /events
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. 提取 Token (支持 Query Param 或 Auth Header)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // 2. 验证 Token (复用 Task-01 的 JWT Secret)
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      const userId = payload.sub || payload._id; // 根据 Task-01 的 JWT Payload 结构调整

      // 3. 加入以 UserId 命名的 Room
      const userRoom = `user:${userId}`;
      await client.join(userRoom);
      
      // 存储 userId 到 socket 实例以便断开时记录（可选）
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${client.id} - ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 发送通知给特定用户
   * 由 SubscriberService 调用
   */
  emitToUser(userId: string, event: string, payload: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit(event, payload);
    this.logger.debug(`Emitted [${event}] to ${userRoom}`);
  }
}