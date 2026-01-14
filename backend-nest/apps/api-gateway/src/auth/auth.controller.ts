// src/auth/auth.controller.ts
import { Body, Controller, Post, UseGuards, Req, HttpCode, HttpStatus, Get,UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto'; //  LoginResponseDto 
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

// simple Refresh Token DTO
import { IsNotEmpty, IsString } from 'class-validator';
class RefreshTokenDto {
    @IsString() @IsNotEmpty() refreshToken: string;
    @IsString() @IsNotEmpty() userId: string; // parse from token
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '凭据无效' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 Access Token' })
  @ApiResponse({ status: 200, description: '返回新的 Token 对' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt')) // login to log off
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户注销' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    await this.authService.logout(req.user['userId']);
    return { message: 'Logged out successfully' };
  }
  
  // test
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取个人信息 (测试 JWT)' })
  getProfile(@Req() req) {
    return req.user;
  }
}