// src/notes/dto/note-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { NoteStatus } from '../schemas/note.schema';

export class NoteResponseDto {
  @ApiProperty({ example: '65a0c123...', description: 'MongoDB ObjectId' })
  _id: string;

  @ApiProperty({ example: 1001, description: 'FAISS 索引用的全局序列 ID' })
  faissId: number;

  @ApiProperty({ enum: NoteStatus, example: NoteStatus.PENDING })
  status: NoteStatus;
}