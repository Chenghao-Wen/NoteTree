from sentence_transformers import SentenceTransformer
import asyncio
from typing import List

class AIEngine:
    def __init__(self):
        # Using a lightweight, high-performance model
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.categories = ["React", "NestJS", "DevOps", "Architecture", "General"]

    def generate_embedding(self, text: str) -> List[float]:
        """
        CPU-bound operation.
        """
        # Encode returns a numpy array, convert to list for generic usage
        embedding = self.embed_model.encode(text)
        return embedding.tolist()

    async def classify_content(self, content: str) -> str:
        """
        Simulates an LLM call. In production, this calls OpenAI/Ollama.
        """
        # Mock Logic: Simple keyword matching for speed in this demo
        content_lower = content.lower()
        if "react" in content_lower or "hook" in content_lower:
            return "React"
        elif "docker" in content_lower or "k8s" in content_lower:
            return "DevOps"
        elif "nestjs" in content_lower or "node" in content_lower:
            return "NestJS"
        
        # Simulate Network Latency
        await asyncio.sleep(0.1) 
        return "General"
    async def generate_rag_response(self, context_text: str, query: str) -> str:
        """
        Generates a grounded answer using an LLM.
        """
        if not context_text:
            return "I couldn't find any relevant notes to answer your question."

        # Prompt Engineering: Strict Grounding
        prompt = f"""
        You are a helpful knowledge assistant. 
        Answer the user question strictly based on the Context provided below.
        If the answer is not in the context, state that you don't know. Do not hallucinate.

        ---
        Context:
        {context_text}
        ---

        User Question: {query}
        """

        # TODO: Replace with actual API call (e.g., OpenAI, Anthropic, Ollama)
        # response = await openai.ChatCompletion.create(model="gpt-4", messages=[...])
        
        # Mocking the LLM generation for this implementation node
        await asyncio.sleep(1.0) # Simulate inference latency
        
        return f"[AI Summary based on {len(context_text)} chars of context]: This is a simulated answer. " \
               f"Based on your notes, the answer to '{query}' involves the concepts found in the retrieved context."

# Singleton
# Singleton
ai_engine = AIEngine()