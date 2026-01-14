from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Stream Names
    STREAM_INDEXING: str = "job:embedding"
    STREAM_SEARCH: str = "job:search"
    STREAM_DEAD_LETTER: str = "stream:dead_letter"
    
    # Consumer Group Config
    CONSUMER_GROUP: str = "ai_worker_group"
    CONSUMER_NAME: str = "worker_01" # In k8s, use hostname
    
    class Config:
        env_file = ".env"

settings = Settings()