
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Auth Service 
  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+passwordHash +currentRefreshTokenHash').exec();
  }

  // Seeding 
  async create(createUserDto: { email: string; password: string }): Promise<UserDocument> {
    const createdUser = new this.userModel({
      email: createUserDto.email,
      passwordHash: createUserDto.password, // Schema hook will hash this
    });
    return createdUser.save();
  }

  //  Refresh Token
  async setCurrentRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      currentRefreshTokenHash: hash,
    });
  }
  
  // Refresh Token (Logout)
  async removeRefreshToken(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      currentRefreshTokenHash: null,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {

    const user = await this.findOneByEmailById(userId);
    if (!user) {
      return null;
    }
    const isMatching = await bcrypt.compare(refreshToken, user.currentRefreshTokenHash || '');
    if (isMatching) {
      return user;
    }
  }

  private async findOneByEmailById(id: string) {
     return this.userModel.findById(id).select('+currentRefreshTokenHash');
  }
}