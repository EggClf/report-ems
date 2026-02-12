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
from csv_upload import router as csv_upload_router
from context_snapshot import router as context_snapshot_router

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

# Include routers
app.include_router(csv_upload_router)
app.include_router(context_snapshot_router)

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    """Request model for predictions"""
    model_type: str = Field(..., description="Model type: 'ES' or 'MRO'")
    features: Dict[str, float] = Field(..., description="Feature values for prediction")
    intent_id: Optional[str] = Field(None, description="Optional intent ID for tracking")

class CellInput(BaseModel):
    """Single cell input for batch prediction"""
    cell_id: str = Field(..., description="Unique cell identifier (e.g. cellname)")
    features: Dict[str, float] = Field(..., description="Feature values for prediction")

class BatchPredictionRequest(BaseModel):
    """Request model for multi-cell batch predictions with trace"""
    model_type: str = Field(..., description="Model type: 'ES' or 'MRO'")
    cells: List[CellInput] = Field(..., description="List of cells with their features")

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

class CellDecisionResult(BaseModel):
    """Individual cell result in a batch response"""
    cell_id: str
    model_type: str
    decision: Optional[bool]
    confidence: Optional[float]
    probabilities: Optional[List[float]]
    path: List[DecisionNode]
    topFeatures: List[FeatureImportance]
    counterfactual: List[Counterfactual]
    featureSnapshot: Dict[str, float]
    error: Optional[str] = None

class BatchTraceResponse(BaseModel):
    """Batch prediction response with per-cell traces"""
    model_type: str
    total_cells: int
    applied_count: int
    not_applied_count: int
    error_count: int
    results: List[CellDecisionResult]
    timestamp: str

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

# Batch prediction with full trace per cell
@app.post("/predict/batch-trace", response_model=BatchTraceResponse, tags=["Prediction"])
async def predict_batch_trace(request: BatchPredictionRequest):
    """
    Make predictions with decision tree traces for multiple cells at once.

    **Parameters:**
    - **model_type**: Either 'ES' or 'MRO'
    - **cells**: List of cell objects each containing cell_id and features

    **Returns:** Per-cell decision, confidence, and full decision tree trace
    """
    try:
        model_service = get_model_service()
        model_type = request.model_type.upper()

        # Use the batch prediction method from model service
        raw_results = model_service.predict_batch(
            model_type,
            [{'cell_id': c.cell_id, 'features': c.features} for c in request.cells]
        )

        cell_results = []
        applied_count = 0
        not_applied_count = 0
        error_count = 0

        for raw in raw_results:
            if raw['error']:
                error_count += 1
                cell_results.append(CellDecisionResult(
                    cell_id=raw['cell_id'],
                    model_type=model_type,
                    decision=None,
                    confidence=None,
                    probabilities=None,
                    path=[],
                    topFeatures=[],
                    counterfactual=[],
                    featureSnapshot=raw.get('feature_values', {}),
                    error=raw['error'],
                ))
                continue

            if raw['decision']:
                applied_count += 1
            else:
                not_applied_count += 1

            # Top features by importance
            importances = raw.get('feature_importances', {})
            sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
            top_features = [
                FeatureImportance(
                    name=name,
                    value=raw['feature_values'].get(name, 0.0),
                    importance=imp,
                )
                for name, imp in sorted_features
            ]

            # Counterfactual from first 3 path nodes
            path = raw.get('path', [])
            counterfactuals = []
            for node in path[:3]:
                if node.get('featureName') and node['featureName'] != 'LEAF':
                    counterfactuals.append(Counterfactual(
                        feature=node['featureName'],
                        currentValue=node['featureValue'],
                        thresholdValue=node['threshold'],
                        alternativeIntent='ES' if model_type == 'MRO' else 'MRO',
                    ))

            # Append LEAF node
            if path:
                path.append({
                    'nodeId': len(path),
                    'condition': f'LEAF: {model_type} = {raw["decision"]}',
                    'threshold': 0.0,
                    'featureValue': 0.0,
                    'featureName': 'LEAF',
                    'passed': True,
                })

            cell_results.append(CellDecisionResult(
                cell_id=raw['cell_id'],
                model_type=model_type,
                decision=raw['decision'],
                confidence=raw['confidence'],
                probabilities=raw['probabilities'],
                path=[DecisionNode(**n) for n in path],
                topFeatures=top_features,
                counterfactual=counterfactuals,
                featureSnapshot=raw['feature_values'],
                error=None,
            ))

        return BatchTraceResponse(
            model_type=model_type,
            total_cells=len(request.cells),
            applied_count=applied_count,
            not_applied_count=not_applied_count,
            error_count=error_count,
            results=cell_results,
            timestamp=datetime.now().isoformat(),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Batch trace prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch trace prediction failed: {str(e)}")

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
