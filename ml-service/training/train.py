import os
import sys
import joblib
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.pipeline import IndustrialDataPipeline

def train_models(df: pd.DataFrame, artifact_dir: str = "models"):
    """
    Trains Anomaly Detection (IsolationForest) and Remaining Useful Life (RUL)
    Regression models on preprocessed telemetry features.
    """
    os.makedirs(artifact_dir, exist_ok=True)
    
    # 1. Fit & Transform Preprocessing Pipeline
    pipeline = IndustrialDataPipeline(window_size=5)
    df_feat, val_report = pipeline.fit_transform(df)
    
    # Save Preprocessor Artifact
    pipeline_path = os.path.join(artifact_dir, "preprocessor_config.json")
    pipeline.save(pipeline_path)

    # Feature List
    feature_cols = [c for c in [
        "temperature_mean", "temperature_std", "temperature_trend",
        "vibration_mean", "vibration_std", "vibration_trend",
        "pressure_mean", "pressure_std",
        "rpm_mean", "rpm_trend",
        "current_mean", "current_trend"
    ] if c in df_feat.columns]

    if not feature_cols:
        raise ValueError("No feature columns available for model training.")

    X = df_feat[feature_cols].fillna(0.0)

    # 2. Train Anomaly Detection Model (IsolationForest)
    from sklearn.ensemble import IsolationForest, RandomForestRegressor
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    iso_forest.fit(X)
    
    iso_path = os.path.join(artifact_dir, "isolation_forest.joblib")
    joblib.dump(iso_forest, iso_path)

    # 3. Train RUL Estimation Regressor
    y_rul = np.maximum(10.0, 500.0 - np.arange(len(df_feat)) * 2.5)
    
    rul_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    rul_model.fit(X, y_rul)

    rul_path = os.path.join(artifact_dir, "rul_regressor.joblib")
    joblib.dump(rul_model, rul_path)

    return {
        "status": "SUCCESS",
        "trained_samples": len(X),
        "features_used": feature_cols,
        "pipeline_path": pipeline_path,
        "isolation_forest_path": iso_path,
        "rul_regressor_path": rul_path
    }

if __name__ == "__main__":
    data = []
    for i in range(100):
        data.append({
            "machineId": "MCH-CNC-001",
            "timestamp": pd.Timestamp.now() - pd.Timedelta(minutes=100-i),
            "temperature": 60.0 + (i * 0.1) + np.random.normal(0, 0.2),
            "vibration": 1.8 + (i * 0.02) + np.random.normal(0, 0.05),
            "pressure": 5.0 + np.random.normal(0, 0.1),
            "rpm": 3000.0 - (i * 1.5) + np.random.normal(0, 5.0),
            "current": 12.0 + (i * 0.08) + np.random.normal(0, 0.2),
            "voltage": 400.0 + np.random.normal(0, 0.5)
        })
    df_raw = pd.DataFrame(data)
    result = train_models(df_raw)
    print("Training Completed Successfully:", result)
