import os
import sys
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.pipeline import IndustrialDataPipeline

class PredictiveInferenceEngine:
    """
    Inference Engine using saved preprocessing pipeline and trained models
    to predict anomaly scores, failure probability, and estimated RUL in hours.
    """
    def __init__(self, artifact_dir: str = "models"):
        self.artifact_dir = artifact_dir
        self.pipeline = None
        self.iso_forest = None
        self.rul_model = None
        self.is_loaded = False

    def load_artifacts(self):
        """Loads preprocessor configuration and model artifacts from disk."""
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")
        iso_path = os.path.join(self.artifact_dir, "isolation_forest.joblib")
        rul_path = os.path.join(self.artifact_dir, "rul_regressor.joblib")

        if os.path.exists(pipeline_path):
            self.pipeline = IndustrialDataPipeline.load(pipeline_path)
        else:
            self.pipeline = IndustrialDataPipeline(window_size=5)

        if os.path.exists(iso_path):
            self.iso_forest = joblib.load(iso_path)

        if os.path.exists(rul_path):
            self.rul_model = joblib.load(rul_path)

        self.is_loaded = True

    def predict(self, telemetry_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Processes incoming telemetry data stream and returns model predictions.
        """
        if not self.is_loaded:
            self.load_artifacts()

        if not telemetry_data:
            return {"error": "Empty telemetry payload."}

        df_raw = pd.DataFrame(telemetry_data)
        df_feat, val_report = self.pipeline.transform(df_raw)

        feature_cols = [c for c in [
            "temperature_mean", "temperature_std", "temperature_trend",
            "vibration_mean", "vibration_std", "vibration_trend",
            "pressure_mean", "pressure_std",
            "rpm_mean", "rpm_trend",
            "current_mean", "current_trend"
        ] if c in df_feat.columns]

        if not feature_cols:
            return {"error": "Feature engineering produced zero features."}

        X = df_feat[feature_cols].fillna(0.0).tail(1)

        # Anomaly Prediction
        anomaly_score = 0.05
        failure_prob = 0.02
        if self.iso_forest:
            scores = self.iso_forest.score_samples(X)
            raw_score = float(-scores[0])
            anomaly_score = max(0.0, round(raw_score, 4))
            failure_prob = min(0.99, max(0.01, round(anomaly_score * 1.5, 4)))

        # RUL Prediction
        predicted_rul = 420.0
        if self.rul_model:
            rul_pred = float(self.rul_model.predict(X)[0])
            predicted_rul = max(10.0, round(rul_pred, 1))

        return {
            "machine_id": df_raw.iloc[-1].get("machineId", df_raw.iloc[-1].get("machine_code", "UNKNOWN")),
            "anomaly_score": anomaly_score,
            "failure_probability": failure_prob,
            "predicted_rul_hours": predicted_rul,
            "validation_report": val_report,
            "model_version": "v1.0.0"
        }
