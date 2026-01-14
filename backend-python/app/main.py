import asyncio
import logging
from app.workers.base_consumer import BaseStreamConsumer
from app.workers.indexing import indexing_processor
from app.workers.search import search_processor
from app.schemas.events import IndexingJob, SearchJob
from app.core.config import settings

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("main")


# Placeholder Processors
async def mock_indexing_processor(job: IndexingJob):
    print(f"[Processing] Embedding note {job.note_id} (FAISS ID: {job.faiss_id})")
    # Simulate work
    await asyncio.sleep(0.5) 

async def mock_search_processor(job: SearchJob):
    print(f"[Processing] Searching for: {job.query}")

async def main():
    logger.info("System Online. Initializing AI Workers...")
    # Instantiate consumers
    indexer = BaseStreamConsumer(
        stream_key=settings.STREAM_INDEXING,
        schema=IndexingJob,
        processor=mock_indexing_processor
    )
    
    searcher = BaseStreamConsumer(
        stream_key=settings.STREAM_SEARCH,
        schema=SearchJob,
        processor=mock_search_processor
    )
    logger.info(f"Listening on streams: {settings.STREAM_INDEXING}, {settings.STREAM_SEARCH}")
    # Run concurrently
    await asyncio.gather(
        indexer.run(),
        searcher.run()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("System Shutdown Initiated.")