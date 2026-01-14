
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  // select: false default no return
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ select: false })
  currentRefreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);


UserSchema.pre('save', async function (this: UserDocument) {

  if (!this.isModified('passwordHash')) {
    return;
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);

});