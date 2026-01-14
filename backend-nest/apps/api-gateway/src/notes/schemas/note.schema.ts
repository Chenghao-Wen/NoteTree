// src/notes/schemas/note.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose'; // 引入 Types

export type NoteDocument = HydratedDocument<Note>;

export enum NoteStatus {
  PENDING = 'PENDING',
  INDEXING = 'INDEXING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Note {
  // 显式声明 _id 为 ObjectId 字符串，方便代码中作为 string 使用，
  // 或者让 Mongoose 自动处理，这里不声明 _id 属性也可以，
  // 但为了类型提示通常会加上：
  _id: Types.ObjectId; 

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true, index: true })
  faissId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: null })
  category: string;

  @Prop({ default: null, index: true })
  parentId: string;

  @Prop({ required: true, enum: NoteStatus, default: NoteStatus.PENDING })
  status: NoteStatus;

  @Prop()
  errorMessage?: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);