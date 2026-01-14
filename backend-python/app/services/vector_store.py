import faiss
import numpy as np
import os
import logging
from app.core.config import settings

logger = logging.getLogger("faiss")

class VectorStore:
    def __init__(self, index_path="faiss_index.bin", dim=384):
        self.index_path = index_path
        self.dim = dim
        self.index = None
        self.op_counter = 0
        self.SNAPSHOT_INTERVAL = 100 # Save every 100 ops

        self._load_or_create()

    def _load_or_create(self):
        if os.path.exists(self.index_path):
            logger.info(f"Loading FAISS index from {self.index_path}")
            self.index = faiss.read_index(self.index_path)
        else:
            logger.info("Creating new FAISS Index (IDMap + FlatL2)")
            # Using IDMap to allow arbitrary 64-bit IDs (faiss_id from Mongo)
            # Standard FlatL2 for exact search (simpler/safer than IVF for start-up)
            self.index = faiss.IndexIDMap(faiss.IndexFlatL2(self.dim))

    def upsert(self, faiss_id: int, vector: list[float]):
        """
        FAISS doesn't support direct update. We must remove then add.
        """
        vector_np = np.array([vector], dtype='float32')
        id_np = np.array([faiss_id], dtype='int64')

        # Remove existing if any (Idempotency)
        try:
            self.index.remove_ids(id_np)
        except Exception:
            pass # ID might not exist

        # Add
        self.index.add_with_ids(vector_np, id_np)
        
        # Snapshot Check
        self.op_counter += 1
        if self.op_counter >= self.SNAPSHOT_INTERVAL:
            self.save()
            self.op_counter = 0

    def delete(self, faiss_id: int):
        id_np = np.array([faiss_id], dtype='int64')
        self.index.remove_ids(id_np)
        self.save() # Always save on delete for safety

    def save(self):
        logger.info(f"Snapshotting FAISS index to {self.index_path}")
        faiss.write_index(self.index, self.index_path)

    def search(self, query_vector: list[float], top_k=3):
        vector_np = np.array([query_vector], dtype='float32')
        distances, ids = self.index.search(vector_np, top_k)
        return ids[0], distances[0]

# Singleton
vector_store = VectorStore()