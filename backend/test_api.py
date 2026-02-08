"""
Test script for the ML prediction API
Tests all endpoints to ensure they work correctly
"""
import requests
import json
from typing import Dict

API_BASE_URL = "http://172.16.28.63:8181"

def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("Testing Health Check")
    print("="*60)

    response = requests.get(f"{API_BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("✓ Health check passed")

def test_es_prediction():
    """Test ES model prediction"""
    print("\n" + "="*60)
    print("Testing ES Model Prediction")
    print("="*60)

    payload = {
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
        "intent_id": "test_intent_es_001"
    }

    response = requests.post(f"{API_BASE_URL}/predict", json=payload)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")

    assert response.status_code == 200
    assert "decision" in result
    assert "confidence" in result
    print(f"✓ ES prediction: {result['decision']} (confidence: {result['confidence']:.2%})")

def test_mro_prediction():
    """Test MRO model prediction"""
    print("\n" + "="*60)
    print("Testing MRO Model Prediction")
    print("="*60)

    payload = {
        "model_type": "MRO",
        "features": {
            "confidence": 0.8,
            "Handover Failure Pressure": 0.7,
            "Handover Success Stability": 0.3,
            "Congestion-Induced HO Risk": 0.6,
            "Mobility Volatility Index": 0.5,
            "Weather-Driven Mobility Risk": -0.3,
            "n_alarm": 6,
            "Social Event Score": 0.4
        },
        "intent_id": "test_intent_mro_001"
    }

    response = requests.post(f"{API_BASE_URL}/predict", json=payload)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")

    assert response.status_code == 200
    assert "decision" in result
    assert "confidence" in result
    print(f"✓ MRO prediction: {result['decision']} (confidence: {result['confidence']:.2%})")

def test_es_prediction_with_trace():
    """Test ES model prediction with decision trace"""
    print("\n" + "="*60)
    print("Testing ES Model Prediction with Trace")
    print("="*60)

    payload = {
        "model_type": "ES",
        "features": {
            "confidence": 0.85,
            "Persistent Low Load Score": 0.6,
            "Energy Inefficiency Score": 0.7,
            "Stable QoS Confidence": 0.88,
            "Mobility Safety Index": 0.82,
            "Social Event Score": 0.25,
            "Traffic Volatility Index": 0.35,
            "Weather Sensitivity Score": 0.15,
            "n_alarm": 3
        },
        "intent_id": "test_intent_es_trace_001"
    }

    response = requests.post(f"{API_BASE_URL}/predict/trace", json=payload)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"\nDecision: {result['decision']} (confidence: {result['confidence']:.2%})")
    print(f"\nTop Features:")
    for feat in result['topFeatures'][:3]:
        print(f"  - {feat['name']}: {feat['value']:.3f} (importance: {feat['importance']:.3f})")

    print(f"\nDecision Path ({len(result['path'])} nodes):")
    for node in result['path'][:3]:
        print(f"  Node {node['nodeId']}: {node['condition']} → {'✓' if node['passed'] else '✗'}")

    assert response.status_code == 200
    assert "path" in result
    assert "topFeatures" in result
    assert "counterfactual" in result
    print("\n✓ ES prediction with trace passed")

def test_model_info():
    """Test model info endpoints"""
    print("\n" + "="*60)
    print("Testing Model Info")
    print("="*60)

    for model_type in ['ES', 'MRO']:
        response = requests.get(f"{API_BASE_URL}/models/{model_type}/info")
        print(f"\n{model_type} Model Info:")
        result = response.json()
        print(f"  Type: {result['model_type']}")
        print(f"  Features: {result['n_features']}")
        print(f"  Model Class: {result['model_class']}")
        print(f"  Feature Names: {', '.join(result['features'][:3])}...")
        assert response.status_code == 200

    print("\n✓ Model info endpoints passed")

def test_list_models():
    """Test list models endpoint"""
    print("\n" + "="*60)
    print("Testing List Models")
    print("="*60)

    response = requests.get(f"{API_BASE_URL}/models")
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Available Models: {len(result['models'])}")
    for model in result['models']:
        print(f"  - {model['name']} ({model['type']})")

    assert response.status_code == 200
    assert len(result['models']) == 2
    print("✓ List models passed")

def test_batch_prediction():
    """Test batch prediction endpoint"""
    print("\n" + "="*60)
    print("Testing Batch Prediction")
    print("="*60)

    payload = [
        {
            "model_type": "ES",
            "features": {
                "confidence": 0.8,
                "Persistent Low Load Score": 0.5,
                "Energy Inefficiency Score": 0.3,
                "Stable QoS Confidence": 0.9,
                "Mobility Safety Index": 0.7,
                "Social Event Score": 0.2,
                "Traffic Volatility Index": 0.4,
                "Weather Sensitivity Score": 0.1,
                "n_alarm": 2
            },
            "intent_id": "batch_es_001"
        },
        {
            "model_type": "MRO",
            "features": {
                "confidence": 0.75,
                "Handover Failure Pressure": 0.8,
                "Handover Success Stability": 0.2,
                "Congestion-Induced HO Risk": 0.7,
                "Mobility Volatility Index": 0.6,
                "Weather-Driven Mobility Risk": -0.4,
                "n_alarm": 7,
                "Social Event Score": 0.5
            },
            "intent_id": "batch_mro_001"
        }
    ]

    response = requests.post(f"{API_BASE_URL}/predict/batch", json=payload)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Results: {result['count']} predictions")
    for res in result['results']:
        print(f"  - {res['intent_id']}: {res['model_type']} → {res['decision']} ({res['confidence']:.2%})")

    assert response.status_code == 200
    assert result['count'] == 2
    print("✓ Batch prediction passed")

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("ML PREDICTION API TEST SUITE")
    print("="*60)
    print(f"Testing API at: {API_BASE_URL}")

    tests = [
        test_health_check,
        test_es_prediction,
        test_mro_prediction,
        test_es_prediction_with_trace,
        test_model_info,
        test_list_models,
        test_batch_prediction
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"\n✗ Test failed: {e}")
            failed += 1

    print("\n" + "="*60)
    print("TEST RESULTS")
    print("="*60)
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")

    if failed == 0:
        print("\n✓ All tests passed!")
    else:
        print(f"\n✗ {failed} test(s) failed")

    return failed == 0

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to API")
        print(f"Make sure the server is running at {API_BASE_URL}")
        print("\nStart the server with:")
        print("  python main.py")
        exit(1)
