import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    _instance = None

    @classmethod
    def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            cls._instance = redis.from_url(
                settings.REDIS_URL, 
                encoding="utf-8", 
                decode_responses=True
            )
        return cls._instance

async def ensure_consumer_group(redis_client: redis.Redis, stream_key: str, group_name: str):
    """
    Idempotent creation of a Redis Consumer Group.
    """
    try:
        await redis_client.xgroup_create(stream_key, group_name, id="0", mkstream=True)
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            pass  # Group already exists
        else:
            raise e