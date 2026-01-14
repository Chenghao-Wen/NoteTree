// path: src/search/search.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 假设 Task-01 已存在
import { SearchService } from './search.service';
import { SearchRequestDto, SearchResponseDto } from './dtos/search.dto';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED) // 202
  @ApiOperation({ summary: '提交异步语义搜索请求' })
  @ApiResponse({ status: 202, type: SearchResponseDto, description: '搜索任务已接受' })
  async search(@Request() req, @Body() dto: SearchRequestDto): Promise<SearchResponseDto> {
    // req.user 由 JwtAuthGuard 注入
    const userId = req.user.userId || req.user._id; 
    return this.searchService.queueSearchJob(userId, dto);
  }
}