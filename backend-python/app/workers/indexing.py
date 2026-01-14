import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.schemas.events import IndexingJob
from app.services.ai_engine import ai_engine
from app.services.vector_store import vector_store
from app.core.config import settings
from app.infrastructure.redis_connector import RedisClient

logger = logging.getLogger("worker.indexing")

# Mongo Connection (Simple Setup)
mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
db = mongo_client["notetree_db"]
collection = db["notes"]

async def indexing_processor(job: IndexingJob):
    """
    Step-by-step implementation of the Sequence Diagram.
    """
    logger.info(f"Processing Job: {job.job_id} | Action: {job.action}")
    redis = RedisClient.get_client()

    if job.action == "DELETE":
        vector_store.delete(job.faiss_id)
        # Assuming Mongo delete handles the doc, we just clean the index
        logger.info(f"Deleted vector for faiss_id: {job.faiss_id}")
        return

    # 1. Generate Embedding (CPU Bound)
    # Note: In a real heavy app, run this in a threadpool executor
    embedding = ai_engine.generate_embedding(job.content)

    # 2. Update FAISS (Memory + Disk Snapshot)
    vector_store.upsert(job.faiss_id, embedding)

    # 3. LLM Classification (IO Bound)
    category = await ai_engine.classify_content(job.content)

    # 4. Update MongoDB (Set Ready)
    await collection.update_one(
        {"faiss_id": job.faiss_id}, # or use note_id if indexed
        {
            "$set": {
                "status": "READY",
                "category": category,
                "vector_ready": True
            }
        }
    )

    # 5. Notify Completion (Redis Pub/Stream)
    # Using PubSub for instant frontend notification via WebSocket Gateway
    notification_payload = {
        "type": "INDEX_DONE",
        "note_id": job.note_id,
        "category": category
    }
    # Publish to a channel the NestJS API is listening to
    await redis.publish("events:system", str(notification_payload))
    
    logger.info(f"Indexing Complete for {job.note_id} as {category}")