import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // 注册 Mongoose 模型，这样 Service 中才能注入 @InjectModel(User.name)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService],
  exports: [UsersService], // 关键：导出 Service 供 AuthModule 使用
})
export class UsersModule {}