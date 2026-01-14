// src/common/schemas/counter.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// 1. 定义 Document 类型，供 Service 注入使用
export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  // 2. 去掉 'extends Document'，避免 _id 类型冲突
  // 我们显式定义 _id 为 string，因为我们将手动赋值 (例如: "note_faiss_id")
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);