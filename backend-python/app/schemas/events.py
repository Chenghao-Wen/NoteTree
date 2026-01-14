from pydantic import BaseModel, Field
from typing import Literal, List

class IndexingJob(BaseModel):
    job_id: str = Field(..., description="Unique Trace ID")
    note_id: str 
    faiss_id: int
    content: str
    action: Literal["UPSERT", "DELETE"]

class SearchJob(BaseModel):
    job_id: str
    user_id: str
    query: str
    top_k: int = 3

class SearchResult(BaseModel):
    job_id: str
    user_id: str
    summary: str
    references: List[str]