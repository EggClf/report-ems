"""
Model Service Layer for ES and MRO ML Models
Handles model loading, prediction, and feature importance extraction
"""
import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
from dataclasses import dataclass


@dataclass
class PredictionResult:
    """Result of model prediction"""
    decision: bool
    confidence: float
    probabilities: List[float]
    feature_values: Dict[str, float]
    feature_importances: Dict[str, float]
    model_type: str


class ModelService:
    """Service for managing and using ML models"""

    def __init__(self, es_model_path: str = "models/es_model.pkl", mro_model_path: str = "models/mro_model.pkl"):
        self.es_model_path = Path(es_model_path)
        self.mro_model_path = Path(mro_model_path)
        self.es_model_data = None
        self.mro_model_data = None

    def load_models(self):
        """Load both ES and MRO models"""
        try:
            with open(self.es_model_path, 'rb') as f:
                self.es_model_data = pickle.load(f)
            print(f"✓ Loaded ES model from {self.es_model_path}")

            with open(self.mro_model_path, 'rb') as f:
                self.mro_model_data = pickle.load(f)
            print(f"✓ Loaded MRO model from {self.mro_model_path}")

        except FileNotFoundError as e:
            raise RuntimeError(f"Model file not found: {e}")
        except Exception as e:
            raise RuntimeError(f"Error loading models: {e}")

    def _validate_features(self, data: Dict[str, float], expected_features: List[str]) -> pd.DataFrame:
        """Validate and prepare features for prediction"""
        # Check for missing features
        missing = set(expected_features) - set(data.keys())
        if missing:
            raise ValueError(f"Missing required features: {missing}")

        # Check for extra features
        extra = set(data.keys()) - set(expected_features)
        if extra:
            print(f"Warning: Extra features provided (will be ignored): {extra}")

        # Create DataFrame with correct feature order
        df = pd.DataFrame([{feat: data[feat] for feat in expected_features}])
        return df

    def _extract_feature_importances(self, model, feature_names: List[str]) -> Dict[str, float]:
        """Extract feature importances from RandomForest model"""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return {name: float(imp) for name, imp in zip(feature_names, importances)}
        return {name: 0.0 for name in feature_names}

    def _get_decision_path(self, model, X: pd.DataFrame, feature_names: List[str]) -> List[Dict[str, Any]]:
        """
        Extract decision path from a tree-based model
        For RandomForest, we use the first tree as representative
        """
        path_nodes = []

        try:
            # Get the first tree from the forest
            if hasattr(model, 'estimators_'):
                tree = model.estimators_[0].tree_

                # Get decision path for the sample
                node_indicator = model.estimators_[0].decision_path(X)
                node_index = node_indicator.indices[node_indicator.indptr[0]:node_indicator.indptr[1]]

                for node_id in node_index:
                    # Skip leaf nodes initially
                    if tree.feature[node_id] != -2:  # -2 indicates leaf node
                        feature_idx = tree.feature[node_id]
                        threshold = tree.threshold[node_id]
                        feature_name = feature_names[feature_idx]
                        feature_value = float(X.iloc[0][feature_name])

                        # Determine if condition passed
                        passed = feature_value > threshold

                        path_nodes.append({
                            'nodeId': int(node_id),
                            'condition': f'{feature_name} > {threshold:.2f}',
                            'threshold': float(threshold),
                            'featureValue': feature_value,
                            'featureName': feature_name,
                            'passed': passed
                        })
        except Exception as e:
            print(f"Warning: Could not extract decision path: {e}")

        return path_nodes

    def predict_es(self, data: Dict[str, float]) -> PredictionResult:
        """Make prediction using ES model"""
        if self.es_model_data is None:
            raise RuntimeError("ES model not loaded. Call load_models() first.")

        model = self.es_model_data['model']
        feature_names = self.es_model_data['feature_names']

        # Validate and prepare input
        X = self._validate_features(data, feature_names)

        # Make prediction
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0].tolist()
        confidence = float(max(probabilities))

        # Get feature importances
        feature_importances = self._extract_feature_importances(model, feature_names)

        return PredictionResult(
            decision=bool(prediction),
            confidence=confidence,
            probabilities=probabilities,
            feature_values=data,
            feature_importances=feature_importances,
            model_type='ES'
        )

    def predict_mro(self, data: Dict[str, float]) -> PredictionResult:
        """Make prediction using MRO model"""
        if self.mro_model_data is None:
            raise RuntimeError("MRO model not loaded. Call load_models() first.")

        model = self.mro_model_data['model']
        feature_names = self.mro_model_data['feature_names']

        # Validate and prepare input
        X = self._validate_features(data, feature_names)

        # Make prediction
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0].tolist()
        confidence = float(max(probabilities))

        # Get feature importances
        feature_importances = self._extract_feature_importances(model, feature_names)

        return PredictionResult(
            decision=bool(prediction),
            confidence=confidence,
            probabilities=probabilities,
            feature_values=data,
            feature_importances=feature_importances,
            model_type='MRO'
        )

    def predict_with_trace(self, model_type: str, data: Dict[str, float]) -> Tuple[PredictionResult, List[Dict[str, Any]]]:
        """
        Make prediction and return decision tree trace
        """
        if model_type.upper() == 'ES':
            result = self.predict_es(data)
            model = self.es_model_data['model']
            feature_names = self.es_model_data['feature_names']
        elif model_type.upper() == 'MRO':
            result = self.predict_mro(data)
            model = self.mro_model_data['model']
            feature_names = self.mro_model_data['feature_names']
        else:
            raise ValueError(f"Unknown model type: {model_type}. Use 'ES' or 'MRO'")

        # Get decision path
        X = pd.DataFrame([{feat: data[feat] for feat in feature_names}])
        path = self._get_decision_path(model, X, feature_names)

        return result, path

    def get_model_info(self, model_type: str) -> Dict[str, Any]:
        """Get information about a model"""
        if model_type.upper() == 'ES':
            model_data = self.es_model_data
        elif model_type.upper() == 'MRO':
            model_data = self.mro_model_data
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        if model_data is None:
            raise RuntimeError(f"{model_type} model not loaded")

        return {
            'model_type': model_data['model_type'],
            'features': model_data['feature_names'],
            'n_features': len(model_data['feature_names']),
            'model_class': type(model_data['model']).__name__
        }


# Singleton instance
_model_service: Optional[ModelService] = None

def get_model_service() -> ModelService:
    """Get or create the model service singleton"""
    global _model_service
    if _model_service is None:
        _model_service = ModelService()
        _model_service.load_models()
    return _model_service
