// src/notes/dto/create-note.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ example: 'React Hooks Deep Dive', description: '笔记标题' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '# Introduction...', description: 'Markdown 格式的笔记内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'Computer Science', description: '用户指定的分类（可选）' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: '65a0...', description: '父节点 ID' })
  @IsString()
  @IsOptional()
  // 注意：此处暂不强制校验 ObjectId 格式，具体由 Pipe 或 Service 层处理，或者使用自定义 Validator
  parentId?: string;
}