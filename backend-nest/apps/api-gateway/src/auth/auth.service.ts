// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto'; 
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // validation users 
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  // login entrance
  async login(user: any) {
    const payload: JwtPayload = { email: user.email, sub: user._id.toString() };
    const tokens = await this.getTokens(payload.sub, payload.email);
    
    //  Refresh Token hash persistence
    await this.updateRefreshToken(user._id, tokens.refreshToken);
    
    return {
      user: {
        id: user._id,
        email: user.email
      },
      ...tokens,
    };
  }

  // log out
  async logout(userId: string) {
    return this.usersService.removeRefreshToken(userId);
  }

  // refreh Token
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.getUserIfRefreshTokenMatches(refreshToken, userId);
    if (!user) throw new ForbiddenException('Access Denied: Invalid Refresh Token');

    const tokens = await this.getTokens(user._id.toString(), user.email);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return tokens;
  }

  // update Hash in DB
  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.usersService.setCurrentRefreshToken(userId, refreshToken);
  }

  // Gen dual Token
  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}