# EMS ML Prediction Backend

Professional FastAPI backend for Energy Saving (ES) and Mobility Robustness Optimization (MRO) intent classification using machine learning models.

## Features

- ✅ **Dual Model Support**: ES and MRO models with separate feature sets
- ✅ **Decision Tree Tracing**: Full explainability with decision paths and feature importance
- ✅ **RESTful API**: Clean, documented endpoints with Pydantic validation
- ✅ **CORS Enabled**: Ready for frontend integration
- ✅ **Batch Predictions**: Efficient bulk processing
- ✅ **Model Introspection**: Query model metadata and features
- ✅ **Health Checks**: Monitor service availability

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Models (First Time Only)

```bash
python create_models.py
```

This creates:
- `es_model.pkl` - Energy Saving model (9 features)
- `mro_model.pkl` - MRO model (8 features)

### 3. Start the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the API

```bash
python test_api.py
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Model Specifications

### ES Model Features (9 features)

| Feature | Range | Description |
|---------|-------|-------------|
| confidence | 0-1 | Model confidence score |
| Persistent Low Load Score | 0-1 | Long-term low traffic indicator |
| Energy Inefficiency Score | 0-1 | Energy waste metric |
| Stable QoS Confidence | 0-1 | Quality of Service stability |
| Mobility Safety Index | 0-1 | User mobility safety score |
| Social Event Score | 0-1 | Social event impact |
| Traffic Volatility Index | 0-1 | Traffic pattern variability |
| Weather Sensitivity Score | **-1 to 1** | Weather impact (negative = adverse) |
| n_alarm | 0+ | Number of active alarms |

**Decision Label**: `true` (enable ES) or `false` (don't enable)

### MRO Model Features (8 features)

| Feature | Range | Description |
|---------|-------|-------------|
| confidence | 0-1 | Model confidence score |
| Handover Failure Pressure | 0-1 | HO failure rate metric |
| Handover Success Stability | 0-1 | HO success consistency |
| Congestion-Induced HO Risk | 0-1 | Congestion impact on handovers |
| Mobility Volatility Index | 0-1 | User mobility variability |
| Weather-Driven Mobility Risk | **-1 to 1** | Weather impact on mobility |
| n_alarm | 0+ | Number of active alarms |
| Social Event Score | 0-1 | Social event impact |

**Decision Label**: `true` (apply MRO optimization) or `false` (don't apply)

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "EMS ML Prediction API",
  "version": "2.0.0"
}
```

### Simple Prediction

```bash
POST /predict
```

Request:
```json
{
  "model_type": "ES",
  "features": {
    "confidence": 0.8,
    "Persistent Low Load Score": 0.7,
    "Energy Inefficiency Score": 0.75,
    "Stable QoS Confidence": 0.9,
    "Mobility Safety Index": 0.85,
    "Social Event Score": 0.3,
    "Traffic Volatility Index": 0.4,
    "Weather Sensitivity Score": 0.2,
    "n_alarm": 2
  },
  "intent_id": "intent_001"
}
```

Response:
```json
{
  "model_type": "ES",
  "decision": true,
  "confidence": 0.88,
  "probabilities": [0.12, 0.88],
  "timestamp": "2026-02-08T10:30:00"
}
```

### Prediction with Decision Trace

```bash
POST /predict/trace
```

Same request format as `/predict`, but returns detailed explanation:

```json
{
  "intentId": "intent_001",
  "intentLabel": "ES",
  "decision": true,
  "confidence": 0.88,
  "path": [
    {
      "nodeId": 0,
      "condition": "Energy Inefficiency Score > 0.65",
      "threshold": 0.65,
      "featureValue": 0.75,
      "featureName": "Energy Inefficiency Score",
      "passed": true
    }
  ],
  "topFeatures": [
    {
      "name": "Energy Inefficiency Score",
      "value": 0.75,
      "importance": 0.42
    }
  ],
  "counterfactual": [...],
  "featureSnapshot": {...}
}
```

### Model Information

```bash
GET /models/{model_type}/info
```

Example: `GET /models/ES/info`

Response:
```json
{
  "model_type": "ES",
  "features": ["confidence", "Persistent Low Load Score", ...],
  "n_features": 9,
  "model_class": "RandomForestClassifier"
}
```

### List Models

```bash
GET /models
```

Response:
```json
{
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
}
```

### Batch Prediction

```bash
POST /predict/batch
```

Request:
```json
[
  {
    "model_type": "ES",
    "features": {...},
    "intent_id": "intent_001"
  },
  {
    "model_type": "MRO",
    "features": {...},
    "intent_id": "intent_002"
  }
]
```

## Example Usage

### Python

```python
import requests

# Simple prediction
response = requests.post('http://localhost:8000/predict', json={
    'model_type': 'ES',
    'features': {
        'confidence': 0.8,
        'Persistent Low Load Score': 0.7,
        # ... other features
    }
})
result = response.json()
print(f"Decision: {result['decision']}, Confidence: {result['confidence']}")

# With trace
response = requests.post('http://localhost:8000/predict/trace', json={...})
trace = response.json()
print(f"Top feature: {trace['topFeatures'][0]['name']}")
```

### JavaScript/TypeScript

```typescript
import { mlModelAPI } from './services/mlModelAPI';

// Simple prediction
const result = await mlModelAPI.predict({
  model_type: 'ES',
  features: { ... },
  intent_id: 'intent_001'
});

// With trace
const trace = await mlModelAPI.getDecisionTreeTrace(
  'intent_001',
  'ES',
  features
);
```

### cURL

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "ES",
    "features": {
      "confidence": 0.8,
      "Persistent Low Load Score": 0.7,
      "Energy Inefficiency Score": 0.75,
      "Stable QoS Confidence": 0.9,
      "Mobility Safety Index": 0.85,
      "Social Event Score": 0.3,
      "Traffic Volatility Index": 0.4,
      "Weather Sensitivity Score": 0.2,
      "n_alarm": 2
    }
  }'
```

## Architecture

```
backend/
├── main.py                 # FastAPI application & endpoints
├── model_service.py        # Model loading & prediction logic
├── create_models.py        # Model generation script
├── test_api.py            # API test suite
├── requirements.txt       # Python dependencies
├── es_model.pkl           # ES model (generated)
├── mro_model.pkl          # MRO model (generated)
└── README.md             # This file
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid model_type, missing features, etc.)
- `500` - Internal Server Error

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

## Frontend Integration

The backend is designed to integrate seamlessly with the React frontend:

1. **Environment Variable**: Set `VITE_API_URL=http://localhost:8000` in `.env`
2. **API Service**: Use `mlModelAPI` from `services/mlModelAPI.ts`
3. **Auto Fallback**: Frontend gracefully falls back to mock data if API is unavailable

The `getMockDecisionTreeTrace` function in `mockDataV2.ts` automatically:
- Checks if the API is healthy
- Uses real ML predictions when available
- Falls back to mock data if API is down

## Production Considerations

1. **CORS**: Update `allow_origins` in [main.py](main.py) to specific domains
2. **Authentication**: Add API key or OAuth middleware
3. **Rate Limiting**: Implement request throttling
4. **Monitoring**: Add logging and metrics collection
5. **Model Updates**: Implement model versioning and hot-reloading
6. **Caching**: Add Redis for prediction caching
7. **Load Balancing**: Deploy multiple instances behind nginx/traefik

## Troubleshooting

### Models not found
```bash
python create_models.py
```

### Port already in use
```bash
uvicorn main:app --port 8001
```

### CORS errors
Check that CORS middleware is configured in [main.py](main.py)

### Frontend can't connect
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `.env` has correct `VITE_API_URL`
3. Look for CORS errors in browser console

## Development

### Regenerate Models
```bash
python create_models.py
```

### Run Tests
```bash
python test_api.py
```

### Hot Reload
```bash
uvicorn main:app --reload
```

### Debug Mode
Add to [main.py](main.py):
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## License

Internal use only - EMS Report System
