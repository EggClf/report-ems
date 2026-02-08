# Temporary Workarounds

## Confidence Feature Missing from Network Scan API

**Issue:** The network scan endpoint at `http://172.16.28.63:8000/network-scan/scan` does not return a `confidence` field, but both ES and MRO ML models require it as the first feature.

**Workaround Location:** `services/networkScanAPI.ts` - `calculateConfidence()` method

**How it works:**
1. Calculates confidence score based on data completeness (0.7 to 0.95 range)
2. Counts how many features have valid (non-null) values
3. Higher completeness = higher confidence score
4. Logs the calculated confidence for debugging

**Formula:**
```
completeness = valid_features / total_features
confidence = 0.7 + (completeness × 0.25)
```

**Example:**
- If 8 out of 8 features are valid: confidence = 0.95
- If 6 out of 8 features are valid: confidence = 0.89
- If 4 out of 8 features are valid: confidence = 0.83
- If 0 features are valid: confidence = 0.70 (minimum)

**Console Logs:**
You'll see logs like:
```
ES features for gHM00356: confidence=0.925, valid_features=8/9
MRO features for gHM00356: confidence=0.875, valid_features=7/8
```

**To Remove Workaround:**
When the network scan API is updated to include confidence:
1. Update `CellFeatures` interface to include: `confidence?: number`
2. Modify `extractMLFeatures()` to use: `features[name] = cell.confidence ?? this.calculateConfidence(cell, featureNames)`
3. Keep `calculateConfidence()` as fallback for backward compatibility

**Alternative Approaches Considered:**
- ❌ Fixed value (0.8): Too simplistic, doesn't reflect data quality
- ❌ Random value: Not deterministic, causes inconsistent results
- ✅ **Calculated from completeness**: Reflects actual data quality

**Required Changes to Network Scan API** (for permanent fix):
```json
{
  "mro_features": [
    {
      "intent_id": "...",
      "cellname": "...",
      "confidence": 0.85,  // ADD THIS FIELD
      "Handover Failure Pressure": 0.23,
      // ... other features
    }
  ],
  "es_features": [
    {
      "intent_id": "...",
      "cellname": "...",
      "confidence": 0.90,  // ADD THIS FIELD
      "Persistent Low Load Score": 0.45,
      // ... other features
    }
  ]
}
```

## Missing Feature Defaults

**Issue:** Some cells may have null/missing values for certain features.

**Workaround:** Default to 0 instead of 0.5 for missing features to avoid bias.

**Rationale:**
- 0 = "no signal" or "not applicable" - neutral
- 0.5 = "medium value" - could bias predictions

**Location:** Same `extractMLFeatures()` method
```typescript
features[name] = value !== null && value !== undefined ? value : 0;
```
