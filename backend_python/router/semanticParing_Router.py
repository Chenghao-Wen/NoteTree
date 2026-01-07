from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from service.semanticPairing import semantic_pairing
semanticPairing_Router = APIRouter()

class SemanticPairingRequest(BaseModel):
    input_concept: str
    existing_nodes: list

class SemanticPairingResponse(BaseModel):
    scores: dict    

@semanticPairing_Router.post("/pair",response_model=SemanticPairingResponse)
async def pair_semantic_data(request: SemanticPairingRequest):
    """Endpoint to perform semantic pairing of input concept with existing nodes.
    """
    try:
        input_concept = request.input_concept
        existing_nodes = request.existing_nodes
        if not input_concept or not existing_nodes:
            raise HTTPException(status_code=400, detail="Input concept and existing nodes cannot be empty")
        scores = semantic_pairing(input_concept, existing_nodes)
        return SemanticPairingResponse(scores=scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
