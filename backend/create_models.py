"""
Script to create ML models for ES and MRO from CSV datasets
"""
import numpy as np
import pandas as pd
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

def create_es_model(csv_path: str = 'data/dataset_es.csv'):
    """Create Energy Saving (ES) model from CSV data"""
    print("Creating ES model...")

    csv_file = Path(csv_path)

    # Feature names for ES
    feature_names = [
        'Persistent Low Load Score',
        'Energy Inefficiency Score',
        'Stable QoS Confidence',
        'Mobility Safety Index',
        'Social Event Score',
        'Traffic Volatility Index',
        'Weather Sensitivity Score',
        'n_alarm'
    ]

    # Check if CSV file exists
    if csv_file.exists():
        print(f"  Loading data from {csv_path}")
        df = pd.read_csv(csv_path)

        # Drop unnecessary columns if they exist
        columns_to_drop = ['intent_id', 'task_type', 'timestamp', 'cellname', 'recommendation']
        df = df.drop([col for col in columns_to_drop if col in df.columns], axis=1, errors='ignore')

        # Ensure we have the decision column
        if 'decision' not in df.columns:
            raise ValueError("CSV must contain 'decision' column")

        # Extract features and target
        X = df[feature_names]
        y = df['decision']

        print(f"  Loaded {len(df)} samples from CSV")
    else:
        print(f"  CSV file not found at {csv_path}, generating mock data...")

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
        df['decision'] = (
            (df['Energy Inefficiency Score'] > 0.6) &
            (df['Persistent Low Load Score'] > 0.5) &
            (df['n_alarm'] < 5)
        ).astype(bool)

        X = df[feature_names]
        y = df['decision']

        print(f"  Generated {len(df)} mock samples")

    # Train model
    model = DecisionTreeClassifier(random_state=42, max_depth=20)
    model.fit(X, y)

    # Save model with feature names
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'model_type': 'ES'
    }

    output_path = Path('models/es_model.pkl')
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'wb') as f:
        joblib.dump(model_data, f)

    print(f"✓ ES model saved to {output_path}")
    print(f"  Features: {len(feature_names)}")
    print(f"  Training samples: {len(X)}")
    print(f"  Training accuracy: {model.score(X, y):.2%}")
    print(f"  True decisions: {y.sum()} / {len(y)} ({y.sum()/len(y):.1%})")
    print()

    return model, feature_names

def create_mro_model(csv_path: str = '../data/dataset_mro.csv'):
    """Create MRO model from CSV data"""
    print("Creating MRO model...")

    # Feature names for MRO
    feature_names = [
        'Handover Failure Pressure',
        'Handover Success Stability',
        'Congestion-Induced HO Risk',
        'Mobility Volatility Index',
        'Weather-Driven Mobility Risk',
        'n_alarm',
        'Social Event Score'
    ]

    csv_file = Path(csv_path)

    # Check if CSV file exists
    if csv_file.exists():
        print(f"  Loading data from {csv_path}")
        df = pd.read_csv(csv_path)

        # Drop unnecessary columns if they exist
        columns_to_drop = ['intent_id', 'task_type', 'timestamp', 'cellname', 'recommendation']
        df = df.drop([col for col in columns_to_drop if col in df.columns], axis=1, errors='ignore')

        # Ensure we have the decision column
        if 'decision' not in df.columns:
            raise ValueError("CSV must contain 'decision' column")

        # Extract features and target
        X = df[feature_names]
        y = df['decision']

        print(f"  Loaded {len(df)} samples from CSV")
    else:
        print(f"  CSV file not found at {csv_path}, generating mock data...")

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
        df['decision'] = (
            (df['Handover Failure Pressure'] > 0.6) &
            (df['Handover Success Stability'] < 0.4) &
            (df['n_alarm'] > 4)
        ).astype(bool)

        X = df[feature_names]
        y = df['decision']

        print(f"  Generated {len(df)} mock samples")

    # Train model
    model = DecisionTreeClassifier(random_state=42, max_depth=20)
    model.fit(X, y)

    # Save model with feature names
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'model_type': 'MRO'
    }

    output_path = Path('models/mro_model.pkl')
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'wb') as f:
        joblib.dump(model_data, f)

    print(f"✓ MRO model saved to {output_path}")
    print(f"  Features: {len(feature_names)}")
    print(f"  Training samples: {len(X)}")
    print(f"  Training accuracy: {model.score(X, y):.2%}")
    print(f"  True decisions: {y.sum()} / {len(y)} ({y.sum()/len(y):.1%})")
    print()

    return model, feature_names

def test_models():
    """Test loading and using the models"""
    print("Testing models...")

    # Test ES model
    es_model_path = Path('models/es_model.pkl')
    if not es_model_path.exists():
        print("ES model not found, skipping test")
        return

    with open(es_model_path, 'rb') as f:
        es_data = joblib.load(f)

    es_model = es_data['model']
    es_features = es_data['feature_names']

    # Create a test sample
    test_es = pd.DataFrame({
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
    mro_model_path = Path('models/mro_model.pkl')
    if not mro_model_path.exists():
        print("MRO model not found, skipping test")
        return

    with open(mro_model_path, 'rb') as f:
        mro_data = joblib.load(f)

    mro_model = mro_data['model']
    mro_features = mro_data['feature_names']

    # Create a test sample
    test_mro = pd.DataFrame({
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
    import sys

    print("=" * 60)
    print("Creating ML Models for ES and MRO")
    print("=" * 60)
    print()

    # Allow custom CSV paths as command line arguments
    es_csv_path = sys.argv[1] if len(sys.argv) > 1 else '../data/dataset_es.csv'
    mro_csv_path = sys.argv[2] if len(sys.argv) > 2 else '../data/dataset_mro.csv'

    create_es_model(es_csv_path)
    create_mro_model(mro_csv_path)
    test_models()

    print("=" * 60)
    print("✓ All models created successfully!")
    print("=" * 60)
