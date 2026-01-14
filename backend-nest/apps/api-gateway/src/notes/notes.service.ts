// src/notes/notes.service.ts
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Redis } from 'ioredis'; // ioredis client type
import { Note, NoteDocument, NoteStatus } from './schemas/note.schema';
import { Counter, CounterDocument } from '../common/schemas/counter.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { REDIS_CLIENT, STREAM_INDEXING } from '../common/constants/redis.constants';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * 获取下一个全局唯一的 FAISS ID (Atomic Operation)
   */
  private async getNextFaissId(): Promise<number> {
    try {
      const counter = await this.counterModel.findByIdAndUpdate(
        'note_faiss_id', // 固定 ID
        { $inc: { seq: 1 } },
        { new: true, upsert: true }, // 返回更新后的值，不存在则创建
      );
      return counter.seq;
    } catch (error) {
      this.logger.error(`Failed to generate sequence ID: ${error.message}`);
      throw new InternalServerErrorException('Sequence generation failed');
    }
  }

  /**
   * 创建笔记并触发索引任务
   */
  async create(userId: string, createNoteDto: CreateNoteDto): Promise<NoteResponseDto> {
    // 1. 原子获取序列号
    const faissId = await this.getNextFaissId();

    // 2. 持久化到 MongoDB
    const newNote = new this.noteModel({
      ...createNoteDto,
      userId,
      faissId,
      status: NoteStatus.PENDING,
    });

    const savedNote = await newNote.save();

    // 3. 发布事件到 Redis Stream (Fire-and-forget 模式，但为了数据可靠性通常需要 await)
    // Payload 必须是 string/buffer
    try {
      await this.redis.xadd(
        STREAM_INDEXING,
        '*', // 自动生成 Message ID
        'noteId', savedNote._id.toString(),
        'faissId', savedNote.faissId.toString(),
        'userId', savedNote.userId,
        'action', 'UPSERT',
        'content', savedNote.content, // Python 端需要原文进行 Embedding
      );
    } catch (redisError) {
      // 严重错误：DB 写入成功但队列失败。
      // 策略：记录日志，后续由补偿任务处理（此处简化为记录 Error）
      this.logger.error(`Failed to enqueue job for note ${savedNote._id}: ${redisError.message}`);
      // 可选：在这里将 Note 状态回滚为 FAILED，取决于业务对一致性的要求
    }

    // 4. 返回响应
    return {
      _id: savedNote._id.toString(),
      faissId: savedNote.faissId,
      status: savedNote.status,
    };
  }
}