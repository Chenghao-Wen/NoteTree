// path: src/events/dtos/ai-result.dto.ts

import { IsString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 枚举事件类型，确保前后端与Python端统一
export enum AiEventType {
  NOTE_STATUS_CHANGED = 'note.status_changed',
  SEARCH_RESULT = 'search.result',
}

// 1. 笔记状态变更负载 (对应 Python 发布的结构)
export class NoteStatusChangedPayload {
  @IsString()
  noteId: string;

  @IsString()
  status: string; // 'READY' | 'FAILED'

  @IsString()
  @IsOptional()
  aiCategory?: string;
}

// 2. 搜索结果负载
export class SearchResultPayload {
  @IsString()
  jobId: string;

  @IsString()
  summary: string;

  @IsObject({ each: true })
  relatedNotes: Array<{ id: string; title: string; score: number }>;
}

// 3. Redis 消息总线包装器 (Python 发布到 channel:ai_results 的根结构)
// 注意：Python 端必须包含 userId 以便网关进行路由
export class AiNotificationMessage {
  @IsEnum(AiEventType)
  event: AiEventType;

  @IsString()
  userId: string; // 路由关键

  @ValidateNested()
  @Type((opts) => {
    // 根据 event 动态决定 payload 类型 (需结合业务逻辑，此处简化为联合类型或泛型处理)
    // 在实际反序列化时，通常先解析外层
    return Object; 
  })
  data: NoteStatusChangedPayload | SearchResultPayload;
}