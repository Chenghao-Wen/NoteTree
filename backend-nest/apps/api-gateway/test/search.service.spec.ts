// path: src/search/search.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../src/search/search.service';
import { SearchRequestDto } from '../src/search/dtos/search.dto';

// 1. 定义 Mock 对象结构
const redisMock = {
  xadd: jest.fn(),
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    // 每次测试前清除 Mock 的调用记录，防止状态污染
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        // 2. 模拟依赖注入
        // 因为 Service 中使用了 @Inject('REDIS_CLIENT')
        // 这里必须提供相同的 Token
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add search job to redis stream', async () => {
    // Arrange (准备数据)
    const userId = 'user-123';
    const dto: SearchRequestDto = { query: 'React State Management' };
    
    // 模拟 Redis XADD 返回一个 Stream ID
    redisMock.xadd.mockResolvedValue('1700000000000-0');

    // Act (执行)
    const result = await service.queueSearchJob(userId, dto);

    // Assert (断言)
    // 1. 验证返回值结构
    expect(result.status).toBe('ACCEPTED');
    expect(result.jobId).toBeDefined();

    // 2. 验证 Redis 是否被正确调用
    // 检查参数是否包含 Stream Key, *, 以及 payload 中的关键字段
    expect(redisMock.xadd).toHaveBeenCalledWith(
      'stream:search', // Key
      '*',             // Auto-generate ID
      'jobId', expect.any(String),
      'userId', userId,
      'query', dto.query,
      'timestamp', expect.any(String)
    );
  });

  it('should throw error if redis fails', async () => {
    const userId = 'user-123';
    const dto: SearchRequestDto = { query: 'Error Case' };

    // 模拟 Redis 抛出异常
    redisMock.xadd.mockRejectedValue(new Error('Redis Connection Failed'));

    // 验证 Service 是否向上传递了异常
    await expect(service.queueSearchJob(userId, dto)).rejects.toThrow('Redis Connection Failed');
  });
});