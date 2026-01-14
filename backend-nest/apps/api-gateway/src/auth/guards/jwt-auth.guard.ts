// path: src/auth/guards/jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 这里通常是空的，除非你需要添加自定义逻辑
  // 例如：覆盖 handleRequest 以处理可选鉴权
}