import logging
import json
from motor.motor_asyncio import AsyncIOMotorClient
from app.schemas.events import SearchJob, SearchResult
from app.services.ai_engine import ai_engine
from app.services.vector_store import vector_store
from app.infrastructure.redis_connector import RedisClient
from app.core.config import settings

logger = logging.getLogger("worker.search")

# Mongo Setup
mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
db = mongo_client["notetree_db"]
collection = db["notes"]

async def search_processor(job: SearchJob):
    logger.info(f"Processing Search Job: {job.job_id} | Query: {job.query}")
    redis = RedisClient.get_client()

    # 1. Vector Search (Retrieval)
    query_vector = ai_engine.generate_embedding(job.query)
    
    # top_k IDs and Distances (We ignore distances for now, but could filter by threshold)
    faiss_ids, _ = vector_store.search(query_vector, top_k=job.top_k)
    
    # Handle Numpy int64 conversion
    faiss_ids = [int(id_) for id_ in faiss_ids if id_ != -1] # -1 means 'not found' in FAISS

    if not faiss_ids:
        await _publish_result(redis, job, "No relevant notes found.", [])
        return

    # 2. Fetch Content (Augmentation)
    # We query Mongo for the actual text content corresponding to these vector IDs
    cursor = collection.find({"faiss_id": {"$in": faiss_ids}})
    docs = await cursor.to_list(length=job.top_k)

    if not docs:
        await _publish_result(redis, job, "No relevant content found in database.", [])
        return

    # Extract Content and IDs for citation
    context_parts = []
    reference_ids = []
    
    for doc in docs:
        # Assuming doc has 'content' and 'note_id' (UUID)
        content = doc.get("content", "")
        uuid = doc.get("id") or doc.get("note_id") # Handle potential naming variance
        
        context_parts.append(content)
        if uuid:
            reference_ids.append(str(uuid))

    full_context = "\n\n".join(context_parts)

    # 3. LLM Generation
    summary = await ai_engine.generate_rag_response(full_context, job.query)

    # 4. Publish Result
    await _publish_result(redis, job, summary, reference_ids)

async def _publish_result(redis, job: SearchJob, summary: str, references: list[str]):
    result_payload = SearchResult(
        job_id=job.job_id,
        user_id=job.user_id,
        summary=summary,
        references=references
    )
    
    # Publish to 'search:results'
    # The NestJS Gateway subscribes here and forwards to the specific user via WebSocket
    await redis.publish("search:results", result_payload.model_dump_json())
    logger.info(f"Published Search Result for {job.job_id}")