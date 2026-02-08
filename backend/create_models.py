"""
Script to create mock ML models for ES and MRO based on skill.md specifications
"""
import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Set random seed for reproducibility
np.random.seed(42)

def create_es_model():
    """Create Energy Saving (ES) model"""
    print("Creating ES model...")

    # Feature names for ES
    feature_names = [
        'confidence',
        'Persistent Low Load Score',
        'Energy Inefficiency Score',
        'Stable QoS Confidence',
        'Mobility Safety Index',
        'Social Event Score',
        'Traffic Volatility Index',
        'Weather Sensitivity Score',
        'n_alarm'
    ]

    # Generate mock training data (1000 samples)
    n_samples = 1000
    data = {}

    for feature in feature_names:
        if feature == 'Weather Sensitivity Score':
            # Range: -1 to 1
            data[feature] = np.random.uniform(-1, 1, n_samples)
        elif feature == 'n_alarm':
            # Integer alarm count
            data[feature] = np.random.randint(0, 10, n_samples)
        else:
            # Range: 0 to 1
            data[feature] = np.random.uniform(0, 1, n_samples)

    # Create DataFrame
    df = pd.DataFrame(data)

    # Generate decision labels based on some logic
    # True if energy inefficiency is high, load is low, and alarms are low
    df['decision'] = (
        (df['Energy Inefficiency Score'] > 0.6) &
        (df['Persistent Low Load Score'] > 0.5) &
        (df['n_alarm'] < 5)
    ).astype(bool)

    # Prepare features and labels
    X = df[feature_names]
    y = df['decision']

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save model with feature names
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'model_type': 'ES'
    }

    with open('es_model.pkl', 'wb') as f:
        pickle.dump(model_data, f)

    print(f"✓ ES model saved to es_model.pkl")
    print(f"  Features: {len(feature_names)}")
    print(f"  Training accuracy: {model.score(X, y):.2%}")
    print(f"  True decisions: {y.sum()} / {len(y)} ({y.sum()/len(y):.1%})")
    print()

def create_mro_model():
    """Create MRO model"""
    print("Creating MRO model...")

    # Feature names for MRO
    feature_names = [
        'confidence',
        'Handover Failure Pressure',
        'Handover Success Stability',
        'Congestion-Induced HO Risk',
        'Mobility Volatility Index',
        'Weather-Driven Mobility Risk',
        'n_alarm',
        'Social Event Score'
    ]

    # Generate mock training data (1000 samples)
    n_samples = 1000
    data = {}

    for feature in feature_names:
        if feature == 'Weather-Driven Mobility Risk':
            # Range: -1 to 1
            data[feature] = np.random.uniform(-1, 1, n_samples)
        elif feature == 'n_alarm':
            # Integer alarm count
            data[feature] = np.random.randint(0, 10, n_samples)
        else:
            # Range: 0 to 1
            data[feature] = np.random.uniform(0, 1, n_samples)

    # Create DataFrame
    df = pd.DataFrame(data)

    # Generate decision labels based on some logic
    # True if handover failure pressure is high, stability is low, and alarms are high
    df['decision'] = (
        (df['Handover Failure Pressure'] > 0.6) &
        (df['Handover Success Stability'] < 0.4) &
        (df['n_alarm'] > 4)
    ).astype(bool)

    # Prepare features and labels
    X = df[feature_names]
    y = df['decision']

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save model with feature names
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'model_type': 'MRO'
    }

    with open('mro_model.pkl', 'wb') as f:
        pickle.dump(model_data, f)

    print(f"✓ MRO model saved to mro_model.pkl")
    print(f"  Features: {len(feature_names)}")
    print(f"  Training accuracy: {model.score(X, y):.2%}")
    print(f"  True decisions: {y.sum()} / {len(y)} ({y.sum()/len(y):.1%})")
    print()

def test_models():
    """Test loading and using the models"""
    print("Testing models...")

    # Test ES model
    with open('es_model.pkl', 'rb') as f:
        es_data = pickle.load(f)

    es_model = es_data['model']
    es_features = es_data['feature_names']

    # Create a test sample
    test_es = pd.DataFrame({
        'confidence': [0.8],
        'Persistent Low Load Score': [0.7],
        'Energy Inefficiency Score': [0.75],
        'Stable QoS Confidence': [0.9],
        'Mobility Safety Index': [0.85],
        'Social Event Score': [0.3],
        'Traffic Volatility Index': [0.4],
        'Weather Sensitivity Score': [0.2],
        'n_alarm': [2]
    })

    es_prediction = es_model.predict(test_es)
    es_proba = es_model.predict_proba(test_es)

    print(f"✓ ES model test:")
    print(f"  Prediction: {es_prediction[0]}")
    print(f"  Probability: {es_proba[0]}")
    print()

    # Test MRO model
    with open('mro_model.pkl', 'rb') as f:
        mro_data = pickle.load(f)

    mro_model = mro_data['model']
    mro_features = mro_data['feature_names']

    # Create a test sample
    test_mro = pd.DataFrame({
        'confidence': [0.8],
        'Handover Failure Pressure': [0.7],
        'Handover Success Stability': [0.3],
        'Congestion-Induced HO Risk': [0.6],
        'Mobility Volatility Index': [0.5],
        'Weather-Driven Mobility Risk': [-0.3],
        'n_alarm': [6],
        'Social Event Score': [0.4]
    })

    mro_prediction = mro_model.predict(test_mro)
    mro_proba = mro_model.predict_proba(test_mro)

    print(f"✓ MRO model test:")
    print(f"  Prediction: {mro_prediction[0]}")
    print(f"  Probability: {mro_proba[0]}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("Creating ML Models for ES and MRO")
    print("=" * 60)
    print()

    create_es_model()
    create_mro_model()
    test_models()

    print("=" * 60)
    print("✓ All models created successfully!")
    print("=" * 60)
