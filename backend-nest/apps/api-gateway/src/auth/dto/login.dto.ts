import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: '用户邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: '用户密码', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '密码长度至少为 6 位' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken: string;

  @ApiProperty({
    description: '用户信息',
    example: { id: '507f1f77bcf86cd799439011', email: 'user@example.com' },
  })
  user: {
    id: string;
    email: string;
  };
}