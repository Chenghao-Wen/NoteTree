import asyncio
import logging
import json
from typing import Callable, Type, Any
from pydantic import ValidationError, BaseModel
from redis.asyncio import Redis

from app.core.config import settings
from app.infrastructure.redis_connector import RedisClient, ensure_consumer_group

logger = logging.getLogger("worker")
logging.basicConfig(level=logging.INFO)

class BaseStreamConsumer:
    def __init__(
        self, 
        stream_key: str, 
        schema: Type[BaseModel], 
        processor: Callable[[Any], Any]
    ):
        self.stream_key = stream_key
        self.schema = schema
        self.processor = processor # The function that does the heavy lifting (Task 02/03)
        self.redis: Redis = RedisClient.get_client()
        self.running = True

    async def _handle_dead_letter(self, raw_data: dict, error_msg: str):
        """Moves failed messages to a DLQ for manual inspection"""
        payload = {
            "original_stream": self.stream_key,
            "error": error_msg,
            "payload": json.dumps(raw_data)
        }
        await self.redis.xadd(settings.STREAM_DEAD_LETTER, payload)
        logger.error(f"Moved message to Dead Letter Queue: {error_msg}")

    async def run(self):
        """
        Main Loop:
        1. XREADGROUP (Count=1) -> Strict Backpressure
        2. Parse Pydantic
        3. Process with Retry Logic
        4. XACK
        """
        await ensure_consumer_group(self.redis, self.stream_key, settings.CONSUMER_GROUP)
        logger.info(f"Consumer started for {self.stream_key}")

        while self.running:
            try:
                # BLOCK=0 means wait indefinitely for new messages
                # count=1 enforces strict backpressure (one at a time)
                streams = await self.redis.xreadgroup(
                    groupname=settings.CONSUMER_GROUP,
                    consumername=settings.CONSUMER_NAME,
                    streams={self.stream_key: ">"},
                    count=1,
                    block=2000 
                )

                if not streams:
                    continue

                for _, messages in streams:
                    for message_id, data in messages:
                        await self.process_message_wrapper(message_id, data)

            except Exception as e:
                logger.error(f"Critical Worker Loop Error: {e}")
                await asyncio.sleep(1) # Prevent CPU spin on connection loss

    async def process_message_wrapper(self, message_id: str, data: dict):
        retries = 3
        ack_needed = False

        # 1. Validation Phase
        try:
            # Redis Stream data is Dict[str, str], we assume flat JSON or field mapping
            # Assuming upstream sends fields flattened or as a 'json' field.
            # Adapting to standard XADD key-values:
            validated_payload = self.schema(**data)
        except ValidationError as e:
            logger.error(f"Validation Error: {e}")
            await self._handle_dead_letter(data, str(e))
            # Invalid schema = unprocessable. Ack to remove from pending.
            await self.redis.xack(self.stream_key, settings.CONSUMER_GROUP, message_id)
            return

        # 2. Processing Phase (With Retry)
        for attempt in range(retries):
            try:
                # Execute the Business Logic
                await self.processor(validated_payload)
                ack_needed = True
                break
            except Exception as e:
                logger.warning(f"Processing failed (Attempt {attempt+1}/{retries}): {e}")
                if attempt == retries - 1:
                    # Final Failure
                    await self._handle_dead_letter(data, f"Max retries reached: {str(e)}")
                    # We ack it to remove from the consumer's pending list, 
                    # effectively 'dropping' it from the main queue since it's now in DLQ.
                    ack_needed = True 
                else:
                    await asyncio.sleep(1 * (attempt + 1)) # Backoff

        # 3. Acknowledgment
        if ack_needed:
            await self.redis.xack(self.stream_key, settings.CONSUMER_GROUP, message_id)