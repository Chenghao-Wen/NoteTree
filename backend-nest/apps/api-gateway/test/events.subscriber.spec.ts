// test/events.subscriber.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventsSubscriberService } from '../src/events/events.subscriber.service';
import { EventsGateway } from '../src/events/events.gateway';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('EventsSubscriberService', () => {
  let service: EventsSubscriberService;
  let gateway: EventsGateway;
  let redisMockInstance: any;

  beforeEach(async () => {
    // Reset mocks
    redisMockInstance = {
      subscribe: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };
    (Redis as unknown as jest.Mock).mockReturnValue(redisMockInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsSubscriberService,
        {
          provide: EventsGateway,
          useValue: { emitToUser: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('redis://localhost:6379') },
        },
      ],
    }).compile();

    service = module.get<EventsSubscriberService>(EventsSubscriberService);
    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should route message to correct user via gateway', () => {
    // 1. Init
    service.onModuleInit();
    
    // 2. Simulate Redis Message
    const mockMsg = JSON.stringify({
      userId: 'user-123',
      event: 'note.status_changed',
      data: { noteId: '1', status: 'READY' }
    });

    // Manually trigger the message handler defined in onModuleInit
    const messageHandler = redisMockInstance.on.mock.calls.find(call => call[0] === 'message')[1];
    messageHandler('channel:ai_results', mockMsg);

    // 3. Verify Gateway Call
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-123',
      'note.status_changed',
      { noteId: '1', status: 'READY' }
    );
  });
});