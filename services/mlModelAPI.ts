/**
 * ML Model API Service
 * Provides methods to interact with the ML prediction backend
 */

import { DecisionTreeTrace, IntentLabel } from '../types-v2';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.28.63:8181';

export interface PredictionRequest {
  model_type: 'ES' | 'MRO';
  features: Record<string, number>;
  intent_id?: string;
}

export interface SimplePredictionResponse {
  model_type: string;
  decision: boolean;
  confidence: number;
  probabilities: number[];
  timestamp: string;
}

export interface DecisionTraceResponse {
  intentId: string;
  intentLabel: string;
  decision: boolean;
  confidence: number;
  path: Array<{
    nodeId: number;
    condition: string;
    threshold: number;
    featureValue: number;
    featureName: string;
    passed: boolean;
  }>;
  topFeatures: Array<{
    name: string;
    value: number;
    importance: number;
  }>;
  counterfactual: Array<{
    feature: string;
    currentValue: number;
    thresholdValue: number;
    alternativeIntent: string;
  }>;
  featureSnapshot: Record<string, number>;
  timestamp: string;
}

export interface ModelInfo {
  model_type: string;
  features: string[];
  n_features: number;
  model_class: string;
}

class MLModelAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Make a simple prediction
   */
  async predict(request: PredictionRequest): Promise<SimplePredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Make a prediction with full decision tree trace
   */
  async predictWithTrace(request: PredictionRequest): Promise<DecisionTraceResponse> {
    const response = await fetch(`${this.baseUrl}/predict/trace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Prediction with trace failed');
    }

    return response.json();
  }

  /**
   * Get decision tree trace formatted for the frontend
   */
  async getDecisionTreeTrace(
    intentId: string,
    modelType: 'ES' | 'MRO',
    features: Record<string, number>
  ): Promise<DecisionTreeTrace> {
    const request: PredictionRequest = {
      model_type: modelType,
      features,
      intent_id: intentId,
    };

    const response = await this.predictWithTrace(request);

    // Convert backend response to frontend DecisionTreeTrace format
    return {
      intentId: response.intentId,
      intentLabel: response.intentLabel as IntentLabel,
      path: response.path,
      topFeatures: response.topFeatures,
      counterfactual: response.counterfactual.map(cf => ({
        ...cf,
        alternativeIntent: cf.alternativeIntent as IntentLabel,
      })),
      featureSnapshot: response.featureSnapshot,
    };
  }

  /**
   * Get model information
   */
  async getModelInfo(modelType: 'ES' | 'MRO'): Promise<ModelInfo> {
    const response = await fetch(`${this.baseUrl}/models/${modelType}/info`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get model info');
    }

    return response.json();
  }

  /**
   * List all available models
   */
  async listModels(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/models`);

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    return response.json();
  }

  /**
   * Make batch predictions
   */
  async predictBatch(requests: PredictionRequest[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requests),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Batch prediction failed');
    }

    return response.json();
  }
}

// Export singleton instance
export const mlModelAPI = new MLModelAPI();

// Helper function to generate sample features for testing
export const generateSampleFeatures = (modelType: 'ES' | 'MRO'): Record<string, number> => {
  if (modelType === 'ES') {
    return {
      'confidence': Math.random() * 0.3 + 0.7, // 0.7-1.0
      'Persistent Low Load Score': Math.random(),
      'Energy Inefficiency Score': Math.random(),
      'Stable QoS Confidence': Math.random() * 0.3 + 0.7,
      'Mobility Safety Index': Math.random() * 0.3 + 0.7,
      'Social Event Score': Math.random(),
      'Traffic Volatility Index': Math.random(),
      'Weather Sensitivity Score': Math.random() * 2 - 1, // -1 to 1
      'n_alarm': Math.floor(Math.random() * 10),
    };
  } else {
    return {
      'confidence': Math.random() * 0.3 + 0.7, // 0.7-1.0
      'Handover Failure Pressure': Math.random(),
      'Handover Success Stability': Math.random(),
      'Congestion-Induced HO Risk': Math.random(),
      'Mobility Volatility Index': Math.random(),
      'Weather-Driven Mobility Risk': Math.random() * 2 - 1, // -1 to 1
      'n_alarm': Math.floor(Math.random() * 10),
      'Social Event Score': Math.random(),
    };
  }
};
