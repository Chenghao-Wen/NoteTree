// src/notes/notes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { Note, NoteStatus } from './schemas/note.schema';
import { Counter } from '../common/schemas/counter.schema';
import { REDIS_CLIENT, STREAM_INDEXING } from '../common/constants/redis.constants';

describe('NotesService', () => {
  let service: NotesService;
  let redisMock: any;
  let noteModelMock: any;
  let counterModelMock: any;

  beforeEach(async () => {
    // Mock Redis
    redisMock = {
      xadd: jest.fn().mockResolvedValue('1678900000000-0'),
    };

    // Mock Mongoose Models
    noteModelMock = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mock_oid',
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: 'mock_oid',
        status: NoteStatus.PENDING,
      }),
    }));

    counterModelMock = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ seq: 1001 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getModelToken(Note.name), useValue: noteModelMock },
        { provide: getModelToken(Counter.name), useValue: counterModelMock },
        { provide: REDIS_CLIENT, useValue: redisMock },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('should create a note, increment counter, and push to redis stream', async () => {
    const userId = 'user_1';
    const dto = { title: 'Test', content: 'Content' };

    const result = await service.create(userId, dto as any);

    // 1. Check Atomic Counter
    expect(counterModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'note_faiss_id',
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    // 2. Check DB Save
    expect(noteModelMock).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      faissId: 1001,
      title: 'Test',
      status: NoteStatus.PENDING,
    }));

    // 3. Check Redis Stream XADD
    expect(redisMock.xadd).toHaveBeenCalledWith(
      STREAM_INDEXING,
      '*',
      'noteId', 'mock_oid',
      'faissId', '1001',
      'userId', userId,
      'action', 'UPSERT',
      'content', 'Content',
    );

    // 4. Check Result
    expect(result).toEqual({
      _id: 'mock_oid',
      faissId: 1001,
      status: NoteStatus.PENDING,
    });
  });
});