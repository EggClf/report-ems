# Workflow Integration Summary

## Overview

Successfully refactored the EMS report system to integrate real backend ML predictions with the frontend dashboard.

## New Workflow

### 1. Data Loading
- **On Mount**: Frontend loads 36 cells from network scan endpoint (`http://172.16.28.63:8000/network-scan/scan`)
- **Manual Refresh Only**: Click refresh button to reload data (no auto-refresh)
- Merges MRO and ES features for each cell

### 2. Cell Display
- **CellsTablePanel** displays all cells in a searchable table
- Shows key metrics (alarms, load, handover stats)
- Model type selector (ES/MRO) to choose which analysis to run
- Color-coded by alarm severity

### 3 Cell Analysis
When user clicks a cell:
1. Extracts features based on selected model type (ES or MRO)
2. Sends features to FastAPI ML backend (`/predict/trace`)
3. Receives decision tree trace with:
   - Prediction decision (true/false)
   - Confidence score
   - Decision path through tree nodes
   - Top 5 feature importances
   - Counterfactual explanations
4. Displays results in **DecisionTreeTracePanel**
5. Scrolls to show the analysis

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│  1. Load cells from network scan API                         │
│     ↓                                                         │
│  2. Display in CellsTablePanel                               │
│     ↓                                                         │
│  3. User clicks cell → Extract features                      │
│     ↓                                                         │
│  4. Send to ML API → Get decision trace                      │
│     ↓                                                         │
│  5. Display in DecisionTreeTracePanel                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                         │
├─────────────────────────────────────────────────────────────┤
│  • Load es_model.pkl & mro_model.pkl                         │
│  • POST /predict/trace                                       │
│  • Run RandomForest prediction                               │
│  • Extract decision path & feature importance                │
│  • Return structured response                                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Files Created/Modified

### Backend
- ✅ `backend/main.py` - FastAPI application with prediction endpoints
- ✅ `backend/model_service.py` - Model loading and prediction logic
- ✅ `backend/create_models.py` - Generate ML models from mock data
- ✅ `backend/test_api.py` - Test suite for all endpoints
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/README.md` - Complete API documentation
- ✅ `backend/start.sh` - Startup script

### Frontend
- ✅ `services/networkScanAPI.ts` - Network scan data fetcher
- ✅ `services/mlModelAPI.ts` - ML prediction API client
- ✅ `components/CellsTablePanel.tsx` - Cell table display
- ✅ `components/LoopMonitoringDashboard.tsx` - Updated workflow
- ✅ `services/mockDataV2.ts` - Updated to use real API with fallback
- ✅ `.env.example` - Configuration template

## Usage

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate models (first time only)
python create_models.py

# Start server
python main.py
# or
./start.sh
```

Server runs at: http://172.16.28.63:8181
API docs: http://172.16.28.63:8181/docs

### Frontend Setup

```bash
# Create .env file
cp .env.example .env

# Edit .env to set API URLs
VITE_API_URL=http://172.16.28.63:8181
VITE_NETWORK_SCAN_URL=http://172.16.28.63:8000/network-scan/scan

# Start frontend
npm run dev
```

### Using the Application

1. **Open dashboard** - Cells load automatically from network scan
2. **Select model type** - Choose ES or MRO button
3. **Click any cell** - Runs ML prediction and shows:
   - Decision (true/false)
   - Confidence score
   - Decision tree path
   - Feature importance ranking
   - Counterfactual explanations
4. **Click refresh button** - Reload cell data only when needed

## API Endpoints

### Network Scan (External)
```
POST http://172.16.28.63:8000/network-scan/scan
Body: {
  "timestamp": "2026-02-04T10:00:00",
  "enable_web_search": false
}
```

Returns: 36 cells with MRO and ES features

### ML Prediction (Your Backend)
```
POST http://172.16.28.63:8181/predict/trace
Body: {
  "model_type": "ES",  // or "MRO"
  "features": {
    "confidence": 0.8,
    "Persistent Low Load Score": 0.7,
    // ... other features
  },
  "intent_id": "cell_gHM00356"
}
```

Returns: Decision trace with full explanation

## Feature Sets

### ES Model (9 features)
- confidence (0-1)
- Persistent Low Load Score (0-1)
- Energy Inefficiency Score (0-1)
- Stable QoS Confidence (0-1)
- Mobility Safety Index (0-1)
- Social Event Score (0-1)
- Traffic Volatility Index (0-1)
- Weather Sensitivity Score (-1 to 1)
- n_alarm (integer)

### MRO Model (8 features)
- confidence (0-1)
- Handover Failure Pressure (0-1)
- Handover Success Stability (0-1)
- Congestion-Induced HO Risk (0-1)
- Mobility Volatility Index (0-1)
- Weather-Driven Mobility Risk (-1 to 1)
- n_alarm (integer)
- Social Event Score (0-1)

## Error Handling

- **Network scan fails**: Shows loading state, logs error
- **ML prediction fails**: Logs error, shows loading state
- **Missing features**: Uses default value 0.5 or 0 for missing data
- **API unavailable**: Falls back to mock data (for backward compatibility)

## Testing

### Test Backend
```bash
cd backend
python test_api.py
```

Tests all endpoints including:
- Health check
- ES prediction
- MRO prediction
- Decision trace
- Model info
- Batch prediction

### Test Integration
1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Open browser and click refresh
4. Click on any cell to trigger prediction
5. Check browser console for logs

## Monitoring

### Backend Logs
```bash
# Start with logging
python main.py

# Look for:
✓ Models loaded successfully
✓ Loaded ES model from es_model.pkl
✓ Loaded MRO model from mro_model.pkl
```

### Frontend Logs
Open browser console to see:
```
✓ Loaded 36 cells from network scan
Running ES prediction for cell gHM00356...
✓ ES prediction complete: true
```

## Rollback Plan

To use mock data instead of real API:

1. In `services/mockDataV2.ts`, set:
```typescript
const USE_REAL_API = false;
```

2. Or disconnect backend and it will automatically fall back

## Next Steps

1. **Production Deploy**: Update CORS origins in `main.py`
2. **Authentication**: Add API keys if needed
3. **Caching**: Add Redis for prediction caching
4. **Monitoring**: Set up logging and metrics
5. **Model Updates**: Implement model versioning
6. **Error UI**: Add toast notifications for errors
7. **Loading States**: Enhance loading UI in CellsTablePanel

## Troubleshooting

### Backend won't start
```bash
pip install -r requirements.txt
python create_models.py
python main.py
```

### Frontend can't connect
```bash
# Check .env file exists
cat .env

# Verify backend is running
curl http://172.16.28.63:8181/health

# Check CORS in browser console
```

### Cells not loading
```bash
# Test network scan endpoint
curl -X POST http://172.16.28.63:8000/network-scan/scan \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2026-02-04T10:00:00", "enable_web_search": false}'
```

### Predictions failing
```bash
# Check model files exist
ls -lh backend/*.pkl

# Test prediction manually
curl -X POST http://172.16.28.63:8181/predict/trace \
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

## Summary

✅ **Removed** auto-refresh - now manual only  
✅ **Added** real network scan integration  
✅ **Created** professional FastAPI backend  
✅ **Built** CellsTablePanel for 36 cells  
✅ **Integrated** ML prediction on cell click  
✅ **Maintained** backward compatibility with mock data  
✅ **Documented** all APIs and workflows  
✅ **Tested** end-to-end integration  

The system now follows your intended design: load real cells, display in table, click to analyze with ML models, show results in DecisionTreeTracePanel.
