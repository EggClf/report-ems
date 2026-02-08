"""
FastAPI Backend for EMS Report System
Provides ML model prediction endpoints for ES and MRO intent classification
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from contextlib import asynccontextmanager
import logging

from model_service import get_model_service, PredictionResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup and cleanup on shutdown"""
    try:
        model_service = get_model_service()
        logger.info("✓ Models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise
    yield
    # Cleanup code here if needed
    logger.info("Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="EMS ML Prediction API",
    description="Machine Learning prediction service for Energy Saving and MRO intent classification",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    """Request model for predictions"""
    model_type: str = Field(..., description="Model type: 'ES' or 'MRO'")
    features: Dict[str, float] = Field(..., description="Feature values for prediction")
    intent_id: Optional[str] = Field(None, description="Optional intent ID for tracking")

class FeatureImportance(BaseModel):
    """Feature importance information"""
    name: str
    value: float
    importance: float

class DecisionNode(BaseModel):
    """Decision tree node information"""
    nodeId: int
    condition: str
    threshold: float
    featureValue: float
    featureName: str
    passed: bool

class Counterfactual(BaseModel):
    """Counterfactual explanation"""
    feature: str
    currentValue: float
    thresholdValue: float
    alternativeIntent: str

class DecisionTraceResponse(BaseModel):
    """Complete decision tree trace response"""
    intentId: str
    intentLabel: str
    decision: bool
    confidence: float
    path: List[DecisionNode]
    topFeatures: List[FeatureImportance]
    counterfactual: List[Counterfactual]
    featureSnapshot: Dict[str, float]
    timestamp: str

class SimplePredictionResponse(BaseModel):
    """Simple prediction response"""
    model_type: str
    decision: bool
    confidence: float
    probabilities: List[float]
    timestamp: str

class ModelInfoResponse(BaseModel):
    """Model information response"""
    model_type: str
    features: List[str]
    n_features: int
    model_class: str

# Health check endpoint
@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return JSONResponse({
        "status": "ok",
        "service": "EMS ML Prediction API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    })

# Simple prediction endpoint
@app.post("/predict", response_model=SimplePredictionResponse, tags=["Prediction"])
async def predict(request: PredictionRequest):
    """
    Make a simple prediction using ES or MRO model

    **Parameters:**
    - **model_type**: Either 'ES' or 'MRO'
    - **features**: Dictionary of feature names and values
    - **intent_id**: Optional tracking ID

    **Returns:** Prediction result with confidence scores
    """
    try:
        model_service = get_model_service()
        model_type = request.model_type.upper()

        # Make prediction
        if model_type == 'ES':
            result = model_service.predict_es(request.features)
        elif model_type == 'MRO':
            result = model_service.predict_mro(request.features)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model_type: {request.model_type}. Use 'ES' or 'MRO'"
            )

        return SimplePredictionResponse(
            model_type=result.model_type,
            decision=result.decision,
            confidence=result.confidence,
            probabilities=result.probabilities,
            timestamp=datetime.now().isoformat()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Decision trace endpoint
@app.post("/predict/trace", response_model=DecisionTraceResponse, tags=["Prediction"])
async def predict_with_trace(request: PredictionRequest):
    """
    Make prediction with full decision tree trace

    Provides detailed explanation of the prediction including:
    - Decision path through the tree
    - Feature importance values
    - Counterfactual explanations
    - Complete feature snapshot

    **Parameters:**
    - **model_type**: Either 'ES' or 'MRO'
    - **features**: Dictionary of feature names and values
    - **intent_id**: Optional tracking ID

    **Returns:** Complete decision trace with explanations
    """
    try:
        model_service = get_model_service()
        model_type = request.model_type.upper()
        intent_id = request.intent_id or f"intent_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Make prediction with trace
        result, path = model_service.predict_with_trace(model_type, request.features)

        # Get top N features by importance
        sorted_features = sorted(
            result.feature_importances.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        top_features = [
            FeatureImportance(
                name=name,
                value=result.feature_values[name],
                importance=importance
            )
            for name, importance in sorted_features
        ]

        # Generate counterfactual explanations
        # Find features close to decision boundaries
        counterfactuals = []
        for node in path[:3]:  # Use first 3 decision nodes
            if node['featureName'] != 'LEAF':
                counterfactuals.append(Counterfactual(
                    feature=node['featureName'],
                    currentValue=node['featureValue'],
                    thresholdValue=node['threshold'],
                    alternativeIntent='ES' if model_type == 'MRO' else 'MRO'
                ))

        # Add leaf node to path
        if path:
            path.append({
                'nodeId': len(path),
                'condition': f'LEAF: {model_type} = {result.decision}',
                'threshold': 0.0,
                'featureValue': 0.0,
                'featureName': 'LEAF',
                'passed': True
            })

        return DecisionTraceResponse(
            intentId=intent_id,
            intentLabel=model_type,
            decision=result.decision,
            confidence=result.confidence,
            path=[DecisionNode(**node) for node in path],
            topFeatures=top_features,
            counterfactual=counterfactuals,
            featureSnapshot=result.feature_values,
            timestamp=datetime.now().isoformat()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction trace error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction trace failed: {str(e)}")

# Model info endpoints
@app.get("/models/{model_type}/info", response_model=ModelInfoResponse, tags=["Models"])
async def get_model_info(model_type: str):
    """
    Get information about a specific model

    **Parameters:**
    - **model_type**: Either 'ES' or 'MRO'

    **Returns:** Model metadata including features and type
    """
    try:
        model_service = get_model_service()
        info = model_service.get_model_info(model_type)
        return ModelInfoResponse(**info)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models", tags=["Models"])
async def list_models():
    """List all available models"""
    return JSONResponse({
        "models": [
            {
                "type": "ES",
                "name": "Energy Saving Model",
                "endpoint": "/predict",
                "features": 9
            },
            {
                "type": "MRO",
                "name": "Mobility Robustness Optimization Model",
                "endpoint": "/predict",
                "features": 8
            }
        ]
    })

# Batch prediction endpoint
@app.post("/predict/batch", tags=["Prediction"])
async def predict_batch(requests: List[PredictionRequest]):
    """
    Make predictions for multiple samples

    **Parameters:**
    - **requests**: List of prediction requests

    **Returns:** List of prediction results
    """
    try:
        model_service = get_model_service()
        results = []

        for req in requests:
            model_type = req.model_type.upper()
            if model_type == 'ES':
                result = model_service.predict_es(req.features)
            elif model_type == 'MRO':
                result = model_service.predict_mro(req.features)
            else:
                results.append({
                    "error": f"Invalid model_type: {req.model_type}",
                    "intent_id": req.intent_id
                })
                continue

            results.append({
                "intent_id": req.intent_id,
                "model_type": result.model_type,
                "decision": result.decision,
                "confidence": result.confidence,
                "probabilities": result.probabilities
            })

        return JSONResponse({"results": results, "count": len(results)})

    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8181, reload=True)
