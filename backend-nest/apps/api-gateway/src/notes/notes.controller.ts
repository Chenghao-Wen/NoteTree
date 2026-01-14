// src/notes/notes.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // 假设使用标准的 Passport JWT
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@ApiTags('Notes')
@ApiBearerAuth() // 声明需要 Bearer Token
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // 保护路由
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted
  @ApiOperation({ summary: '上传笔记并触发异步索引', description: '将笔记存入 MongoDB 并推送到 Redis Stream 等待 Python 处理' })
  @ApiResponse({ status: 202, description: '任务已接收', type: NoteResponseDto })
  async create(@Req() req: any, @Body() createNoteDto: CreateNoteDto): Promise<NoteResponseDto> {
    // 假设 JWT Strategy 将解析后的 user 挂载在 req.user 上，且包含 userId 字段
    // 在实际生产中，建议使用自定义 @User() 装饰器来提取
    const userId = req.user.userId; 
    return this.notesService.create(userId, createNoteDto);
  }
}