// path: src/search/dtos/search.dto.ts

import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchRequestDto {
  @ApiProperty({
    example: 'React 的状态管理有哪些优缺点？',
    description: '用户的自然语言查询',
    minLength: 2,
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '搜索内容太短' })
  @MaxLength(500, { message: '搜索内容不能超过 500 字符' })
  query: string;
}

export class SearchResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  jobId: string;

  @ApiProperty({ example: 'ACCEPTED', description: '任务已进入队列' })
  status: string;
}