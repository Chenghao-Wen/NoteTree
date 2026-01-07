from fastapi import FastAPI
import uvicorn
from router.semanticParing_Router import semanticPairing_Router
app=FastAPI()
app.include_router(semanticPairing_Router, prefix="/semanticPairing", tags=["semanticPairing"])
if __name__ == "__main__":
    # Run the FastAPI application
    uvicorn.run(app, host="localhost", port=8001)
